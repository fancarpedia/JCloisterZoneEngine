import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { List } from "../../../../io/vavr/SeqTypes.js";
import { JavaEnum } from "../../../../lang/JavaEnum.js";
import type { XmlElement } from "../../XmlUtils.js";
import type { Player } from "../../Player.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { TokenReceivedEvent } from "../../event/TokenReceivedEvent.js";
import { City } from "../../feature/City.js";
import type { Feature } from "../../feature/Feature.js";
import type { Scoreable } from "../../feature/Scoreable.js";
import { FeatureModifier } from "../../feature/modifier/FeatureModifier.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import { Capability } from "../Capability.js";
import type { ScoreFeatureReducer } from "../ScoreFeatureReducer.js";
import { GameElementQuery } from "../setup/GameElementQuery.js";
import type { Token } from "../Token.js";
import type { GameState } from "../state/GameState.js";

type GoodsMap = VMap<TradeGoodsCapability.TradeGoods, number>;

/** Traders & Builders trade goods (wine/cloth/grain): collect goods when a city
 *  scores; at game end the majority holder of each good scores 10. */
export class TradeGoodsCapability extends Capability<void> {
  // lazy: the namespace (TradeGoodsModifier) is merged after this class body runs
  private static _TRADE_GOODS: TradeGoodsCapability.TradeGoodsModifier | null = null;
  static get TRADE_GOODS(): TradeGoodsCapability.TradeGoodsModifier {
    if (TradeGoodsCapability._TRADE_GOODS === null) {
      TradeGoodsCapability._TRADE_GOODS = new TradeGoodsCapability.TradeGoodsModifier();
    }
    return TradeGoodsCapability._TRADE_GOODS;
  }
  private static readonly RESOURCE_POINTS = 10;

  override onTurnScoring(state: GameState, completed: HashMap<Scoreable, ScoreFeatureReducer>): GameState {
    for (const feature of completed.keySet()) {
      if (!(feature instanceof City)) continue;
      const cityTradeGoods = feature.getModifier<GoodsMap>(
        state,
        TradeGoodsCapability.TRADE_GOODS,
        null as unknown as GoodsMap,
      );
      if (cityTradeGoods === null || cityTradeGoods === undefined) continue;

      const playerIdx = state.getPlayers().getTurnPlayerIndex()!;
      state = state.mapPlayers((ps) => {
        for (const t of cityTradeGoods) ps = ps.addTokenCount(playerIdx, t._1, t._2 as number);
        return ps;
      });
      for (const t of cityTradeGoods) {
        const ev = new TokenReceivedEvent(
          PlayEventMeta.createWithActivePlayer(state),
          state.getPlayers().getTurnPlayer()!,
          t._1,
          t._2,
        );
        ev.setSourceFeature(feature as Feature);
        state = state.appendEvent(ev);
      }
    }
    return state;
  }

  override initFeature(state: GameState, tileId: string, feature: Feature, xml: XmlElement): Feature {
    if (feature instanceof City && xml.hasAttribute("resource")) {
      const res = TradeGoodsCapability.TradeGoods.valueOf(xml.getAttribute("resource").toUpperCase());
      return feature.putModifier(
        TradeGoodsCapability.TRADE_GOODS,
        HashMap.of(res, 1) as unknown as GoodsMap,
      );
    }
    return feature;
  }

  override onFinalScoring(state: GameState): GameState {
    const ps = state.getPlayers();
    for (const tr of TradeGoodsCapability.TradeGoods.values()) {
      let hiVal = 1;
      let hiPlayers: List<Player> = List.empty<Player>();
      for (const player of ps.getPlayers()) {
        const playerValue = ps.getPlayerTokenCount(player.getIndex(), tr);
        if (playerValue > hiVal) {
          hiVal = playerValue;
          hiPlayers = List.of(player);
        } else if (playerValue === hiVal) {
          hiPlayers = hiPlayers.prepend(player) as List<Player>;
        }
      }
      let pts: List<ReceivedPoints> = List.empty<ReceivedPoints>();
      for (const player of hiPlayers) {
        const expr = new PointsExpression(
          "trade-goods",
          new ExprItem("trade-goods." + tr.name(), TradeGoodsCapability.RESOURCE_POINTS),
        );
        pts = pts.append(new ReceivedPoints(expr, player, null)) as List<ReceivedPoints>;
      }
      if (!pts.isEmpty()) {
        state = new AddPoints(pts, false, true).apply(state);
      }
    }
    return state;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TradeGoodsCapability {
  export class TradeGoods extends JavaEnum implements Token {
    static readonly WINE = new TradeGoods("WINE", 0);
    static readonly CLOTH = new TradeGoods("CLOTH", 1);
    static readonly GRAIN = new TradeGoods("GRAIN", 2);
    private static readonly VALUES: readonly TradeGoods[] = [TradeGoods.WINE, TradeGoods.CLOTH, TradeGoods.GRAIN];
    static values(): readonly TradeGoods[] {
      return TradeGoods.VALUES;
    }
    static valueOf(name: string): TradeGoods {
      const v = TradeGoods.VALUES.find((t) => t.name() === name);
      if (v === undefined) throw new Error("No TradeGoods " + name);
      return v;
    }
  }

  export class TradeGoodsModifier extends FeatureModifier<VMap<TradeGoods, number>> {
    constructor() {
      super("city[resource]", new GameElementQuery("traders"));
    }
    override mergeValues(
      tg1: VMap<TradeGoods, number>,
      tg2: VMap<TradeGoods, number>,
    ): VMap<TradeGoods, number> {
      return tg1.merge(tg2, (a, b) => a + b);
    }
    override valueOf(_attr: string): VMap<TradeGoods, number> {
      throw new Error("UnsupportedOperation");
    }
  }
}

Capability.register(TradeGoodsCapability);
