import { Queue } from "../../../../io/vavr/SeqTypes.js";
import type { ClassToken } from "../../../../lang/Class.js";
import type { Player } from "../../Player.js";
import { BazaarBidAction } from "../../action/BazaarBidAction.js";
import { BazaarSelectBuyOrSellAction } from "../../action/BazaarSelectBuyOrSellAction.js";
import { BazaarSelectTileAction } from "../../action/BazaarSelectTileAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import { TileAuctionedEvent, type BuyOrSellOption } from "../../event/TileAuctionedEvent.js";
import { BazaarBidMessage } from "../../io/message/BazaarBidMessage.js";
import { BazaarBuyOrSellMessage } from "../../io/message/BazaarBuyOrSellMessage.js";
import { PassMessage } from "../../io/message/PassMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { AddPointsSilently } from "../../reducers/AddPointsSilently.js";
import { Rule } from "../Rule.js";
import { BazaarCapability } from "../capability/BazaarCapability.js";
import { BazaarCapabilityModel } from "../capability/BazaarCapabilityModel.js";
import { BazaarItem } from "../capability/BazaarItem.js";
import { ActionsState } from "../state/ActionsState.js";
import { Flag } from "../state/Flag.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const BAZAAR_CLS = BazaarCapability as unknown as ClassToken<BazaarCapability>;

/** The bazaar auction (Bridges, Castles & Bazaars): when a bazaar tile is placed, as many
 *  tiles as players are drawn; players in turn select a tile and (unless no-auction) bid
 *  for it — the selecting player finally buys at the highest bid or sells to the bidder. */
export class BazaarPhase extends Phase {
  static readonly simpleName = "BazaarPhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    if (!state.hasFlag(Flag.BAZAAR_AUCTION)) {
      return this.next(state);
    }
    const playersCount = state.getPlayers().length();
    let tilePack = state.getTilePack()!;
    if (tilePack.size() < playersCount || playersCount < 2) {
      return this.next(state);
    }
    let supply: Queue<BazaarItem> = Queue.empty<BazaarItem>();
    for (let i = 0; i < playersCount; i++) {
      const t = tilePack.drawTile(this.getRandom());
      tilePack = t._2;
      supply = supply.append(new BazaarItem(t._1, 0, null, null)) as Queue<BazaarItem>;
    }
    state = state.setTilePack(tilePack);
    const player = state.getTurnPlayer()!.getNextPlayer(state);
    const model = new BazaarCapabilityModel(supply, null, player);
    state = state.setCapabilityModel(BAZAAR_CLS as never, model as never);
    const noAuction = state.getBooleanRule(Rule.BAZAAR_NO_AUCTION);
    const action = new BazaarSelectTileAction(noAuction);
    state = state.setPlayerActions(
      new ActionsState(player, action as unknown as PlayerAction<unknown>, false),
    );
    return this.promote(state);
  }

  private capModel(state: GameState): BazaarCapabilityModel {
    return state.getCapabilityModel<BazaarCapabilityModel>(BAZAAR_CLS as never)!;
  }

  private hasTileAssigned(model: BazaarCapabilityModel, p: Player): boolean {
    for (const bi of model.getSupply()!) {
      if (bi.getOwner() !== null && p.equals(bi.getOwner())) return true;
    }
    return false;
  }

  private getUnassignedTilesCount(model: BazaarCapabilityModel): number {
    let count = 0;
    for (const bi of model.getSupply()!) {
      if (bi.getOwner() === null) count++;
    }
    return count;
  }

  handleBazaarBid(state: GameState, msg: BazaarBidMessage): StepResult {
    const supplyIndex = msg.getSupplyIndex();
    const price = msg.getPrice();
    const noAuction = state.getBooleanRule(Rule.BAZAAR_NO_AUCTION);
    const player = state.getActivePlayer()!;
    const action = state.getPlayerActions()!.getActions().head();
    const isTileSelection = action instanceof BazaarSelectTileAction;

    state = state.mapCapabilityModel<BazaarCapabilityModel>(BAZAAR_CLS as never, (model) => {
      let item = model.getAuctionedItem();
      if (isTileSelection) {
        item = model.getSupply()!.get(supplyIndex);
        model = model.setAuctionedItemIndex(supplyIndex);
        if (noAuction) {
          item = item.setOwner(player);
          model = model.updateSupplyItem(supplyIndex, item);
          return model;
        }
      } else {
        if (price <= item!.getCurrentPrice()) {
          throw new Error("Bidded price must be higher then current");
        }
      }
      item = item!.setCurrentPrice(price);
      item = item.setCurrentBidder(player);
      model = model.updateSupplyItem(supplyIndex, item);
      return model;
    });

    if (noAuction) {
      const tile = this.capModel(state).getSupply()!.get(msg.getSupplyIndex()).getTile();
      state = state.appendEvent(
        new TileAuctionedEvent(PlayEventMeta.createWithPlayer(player), tile, "BUY", 0, player, null),
      );
      return this.nextSelectingPlayer(state);
    }
    return this.nextBidder(state);
  }

  private nextBidder(state: GameState): StepResult {
    let nextBidder = state.getActivePlayer()!;
    const model = this.capModel(state);
    const item = model.getAuctionedItem()!;
    const tileSelectingPlayer = model.getTileSelectingPlayer()!;
    do {
      nextBidder = nextBidder.getNextPlayer(state);
      if (nextBidder.equals(tileSelectingPlayer)) {
        // all players have bid
        if (item.getCurrentBidder() !== null && tileSelectingPlayer.equals(item.getCurrentBidder())) {
          return this.buyOrSell(state, "BUY");
        }
        const action = new BazaarSelectBuyOrSellAction();
        return this.promote(
          state.setPlayerActions(
            new ActionsState(nextBidder, action as unknown as PlayerAction<unknown>, false),
          ),
        );
      }
    } while (this.hasTileAssigned(model, nextBidder));
    const action = new BazaarBidAction();
    return this.promote(
      state.setPlayerActions(
        new ActionsState(nextBidder, action as unknown as PlayerAction<unknown>, false),
      ),
    );
  }

  private nextSelectingPlayer(state: GameState): StepResult {
    let model = this.capModel(state);
    const currentSelectingPlayer = model.getTileSelectingPlayer()!;
    let player = currentSelectingPlayer;
    model = model.setAuctionedItemIndex(null);
    const tilesCount = this.getUnassignedTilesCount(model);
    do {
      player = player.getNextPlayer(state);
      if (!this.hasTileAssigned(model, player)) {
        model = model.setTileSelectingPlayer(player);
        const noAuction = state.getBooleanRule(Rule.BAZAAR_NO_AUCTION);
        state = state.setCapabilityModel(BAZAAR_CLS as never, model as never);
        if (tilesCount > 1) {
          const action = new BazaarSelectTileAction(noAuction);
          state = state.setPlayerActions(
            new ActionsState(player, action as unknown as PlayerAction<unknown>, false),
          );
          return this.promote(state);
        } else {
          let bi = model.getSupply()!.find((item) => item.getOwner() === null).get();
          const index = model.getSupply()!.indexOf(bi);
          bi = bi.setOwner(player);
          model = model.updateSupplyItem(index, bi);
          state = state.setCapabilityModel(BAZAAR_CLS as never, model as never);
          state = state.appendEvent(
            new TileAuctionedEvent(
              PlayEventMeta.createWithPlayer(player),
              bi.getTile(),
              "BUY",
              0,
              player,
              null,
            ),
          );
          break;
        }
      }
    } while (!player.equals(currentSelectingPlayer));

    // all tiles have been auctioned — reorder the supply by play order
    const supply = model.getSupply()!;
    model = model.setSupply(
      Queue.ofAll(
        state
          .getPlayers()
          .getPlayersBeginWith(state.getTurnPlayer()!.getNextPlayer(state))
          .toArray()
          .map((p) => supply.find((bi) => p.equals(bi.getOwner())).get()),
      ) as Queue<BazaarItem>,
    );
    model = model.setAuctionedItemIndex(null);
    model = model.setTileSelectingPlayer(null);
    state = state.setCapabilityModel(BAZAAR_CLS as never, model as never);
    return this.next(state);
  }

  override handlePass(state: GameState, _msg: PassMessage): StepResult {
    const model = this.capModel(state);
    const p = state.getActivePlayer()!;
    if (model.getTileSelectingPlayer() !== null && p.equals(model.getTileSelectingPlayer())) {
      throw new Error("Tile selecting player is not allowed to pass");
    }
    return this.nextBidder(state);
  }

  handleBazaarBuyOrSell(state: GameState, msg: BazaarBuyOrSellMessage): StepResult {
    return this.buyOrSell(state, msg.getValue());
  }

  private buyOrSell(state: GameState, option: BuyOrSellOption): StepResult {
    let model = this.capModel(state);
    let bi = model.getAuctionedItem()!;
    let points = bi.getCurrentPrice();
    const pSelecting = model.getTileSelectingPlayer()!;
    const pBidding = bi.getCurrentBidder();
    if (option === "SELL") points *= -1;
    state = new AddPointsSilently(pSelecting, -points).apply(state);
    if (pBidding !== null && !pSelecting.equals(pBidding)) {
      state = new AddPointsSilently(pBidding, points).apply(state);
    }
    bi = bi.setOwner(option === "BUY" ? pSelecting : pBidding);
    bi = bi.setCurrentBidder(null);
    model = model.updateSupplyItem(model.getAuctionedItemIndex()!, bi);
    state = state.setCapabilityModel(BAZAAR_CLS as never, model as never);
    state = state.appendEvent(
      new TileAuctionedEvent(
        PlayEventMeta.createWithPlayer(pSelecting),
        bi.getTile(),
        option,
        points,
        pSelecting,
        pBidding !== null && pSelecting.equals(pBidding) ? null : pBidding,
      ),
    );
    return this.nextSelectingPlayer(state);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(BazaarBidMessage, this.handleBazaarBid);
    m.set(BazaarBuyOrSellMessage, this.handleBazaarBuyOrSell);
    return m;
  }
}
