import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { HashSet, type Set as VSet } from "../../../../io/vavr/Set.js";
import { Vector } from "../../../../io/vavr/SeqTypes.js";
import { JavaEnum } from "../../../../lang/JavaEnum.js";
import type { Player } from "../../Player.js";
import { Position } from "../../board/Position.js";
import { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { TokenReceivedEvent } from "../../event/TokenReceivedEvent.js";
import { TokenRemovedEvent } from "../../event/TokenRemovedEvent.js";
import { Castle } from "../../feature/Castle.js";
import { isInstanceOfMonastic } from "../../feature/Monastic.js";
import type { PlacedTile } from "../state/PlacedTile.js";
import type { Scoreable } from "../../feature/Scoreable.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import type { XmlElement } from "../../XmlUtils.js";
import { Capability } from "../Capability.js";
import type { ScoreFeatureReducer } from "../ScoreFeatureReducer.js";
import type { Token } from "../Token.js";
import type { GameState } from "../state/GameState.js";

export type GoldModel = VMap<Position, number>;

/** Goldmines (mini-expansion). Gold pieces are dropped on/around goldmine tiles and
 *  awarded to players who score features touching them; held gold scores a bonus. */
export class GoldminesCapability extends Capability<GoldModel> {
  static readonly GOLDMINE = new TileModifier("Goldmine");

  override initTile(_state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (tileElement.getElementsByTagName("goldmine").length > 0) {
      tile = tile.addTileModifier(GoldminesCapability.GOLDMINE);
    }
    return tile;
  }

  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    return this.setModel(state, HashMap.empty<Position, number>());
  }

  private getFeatureClaimPositions(state: GameState, feature: Scoreable): Position[] {
    if (isInstanceOfMonastic(feature)) {
      // Java: ((Monastic) feature).getRangeTiles() — 8 neighbours for a cloister/garden,
      // 4 diagonals for a fish hut. The feature's own tile is NOT included.
      return feature
        .getRangeTiles(state)
        .map((pt: PlacedTile) => pt.getPosition())
        .toArray();
    }
    if (feature instanceof Castle) {
      return feature.getVicinity().toArray();
    }
    return feature.getTilePositions().toArray();
  }

  override onTurnScoring(state: GameState, completed: VMap<Scoreable, ScoreFeatureReducer>): GameState {
    let placedGold = this.getModel(state);
    const posKey = (p: Position) => p.toString();
    const posByKey = new globalThis.Map<string, Position>();
    // pos -> set of claiming player indices
    const claimed = new globalThis.Map<string, Set<number>>();

    for (const t of completed) {
      const owners = t._2.getOwners();
      if (owners.isEmpty()) continue;
      const ownerIdx = owners.toArray().map((p) => p.getIndex());
      for (const pos of this.getFeatureClaimPositions(state, t._1)) {
        if (!placedGold.containsKey(pos)) continue;
        const k = posKey(pos);
        posByKey.set(k, pos);
        let s = claimed.get(k);
        if (s === undefined) {
          s = new globalThis.Set<number>();
          claimed.set(k, s);
        }
        for (const i of ownerIdx) s.add(i);
      }
    }

    if (claimed.size === 0) return state;

    // award best-claim first: tiles claimed by more players are awarded earlier
    const entries = [...claimed.entries()].sort((a, b) => b[1].size - a[1].size);
    const awarded = new globalThis.Map<number, number>();
    const awardedPositions = new globalThis.Map<number, Position[]>();
    for (const p of state.getPlayers().getPlayers()) {
      awarded.set(p.getIndex(), 0);
      awardedPositions.set(p.getIndex(), []);
    }

    let goldPieces = 0;
    for (const k of claimed.keys()) goldPieces += placedGold.get(posByKey.get(k)!).getOrElse(0);

    let player: Player = state.getTurnPlayer()!;
    while (goldPieces > 0) {
      for (const [k, claimingPlayers] of entries) {
        const pos = posByKey.get(k)!;
        const piecesOnTile = placedGold.get(pos).getOrElse(0);
        if (piecesOnTile > 0 && claimingPlayers.has(player.getIndex())) {
          goldPieces--;
          awarded.set(player.getIndex(), awarded.get(player.getIndex())! + 1);
          awardedPositions.get(player.getIndex())!.push(pos);
          placedGold = piecesOnTile === 1 ? placedGold.remove(pos) : placedGold.put(pos, piecesOnTile - 1);
          break;
        }
      }
      player = player.getNextPlayer(state);
    }

    state = this.setModel(state, placedGold);
    for (const p of state.getPlayers().getPlayers()) {
      const count = awarded.get(p.getIndex())!;
      if (count > 0) {
        state = state.mapPlayers((ps) => ps.addTokenCount(p.getIndex(), GoldminesCapability.GoldToken.GOLD, count));
        const ev = new TokenReceivedEvent(
          PlayEventMeta.createWithActivePlayer(state),
          p,
          GoldminesCapability.GoldToken.GOLD,
          count,
        );
        // distinct source positions (Java accumulates them in a HashSet)
        ev.setSourcePositions(Vector.ofAll(HashSet.ofAll(awardedPositions.get(p.getIndex())!).toArray()));
        state = state.appendEvent(ev);
      }
    }
    return state;
  }

  override onMeteoriteImpact(state: GameState, _pt: PlacedTile, positions: VSet<Position>): GameState {
    const model = this.getModel(state);
    for (const pos of positions) {
      const count = model.get(pos).getOrNull();
      if (count !== null) {
        state = state.appendEvent(
          new TokenRemovedEvent(
            PlayEventMeta.createWithActivePlayer(state),
            GoldminesCapability.GoldToken.GOLD,
            pos,
            count,
            true,
          ),
        );
      }
    }
    let newModel = this.getModel(state);
    for (const pos of positions) newModel = newModel.remove(pos);
    return this.setModel(state, newModel);
  }

  override onFinalScoring(state: GameState): GameState {
    const ps = state.getPlayers();
    for (const player of ps.getPlayers()) {
      const pieces = ps.getPlayerTokenCount(player.getIndex(), GoldminesCapability.GoldToken.GOLD);
      if (pieces === 0) continue;
      let points: number;
      if (pieces < 4) points = pieces;
      else if (pieces < 7) points = 2 * pieces;
      else if (pieces < 10) points = 3 * pieces;
      else points = 4 * pieces;
      const expr = new PointsExpression("gold", new ExprItem(pieces, "gold", points));
      state = new AddPoints(new ReceivedPoints(expr, player, null), false, true).apply(state);
    }
    return state;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GoldminesCapability {
  export class GoldToken extends JavaEnum implements Token {
    static readonly GOLD = new GoldToken("GOLD", 0);
    private static readonly VALUES: readonly GoldToken[] = [GoldToken.GOLD];
    static values(): readonly GoldToken[] {
      return GoldToken.VALUES;
    }
  }
}

Capability.register(GoldminesCapability);
