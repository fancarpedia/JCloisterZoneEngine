import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { Arr, Stream } from "../../../../io/vavr/SeqTypes.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import { JavaEnum } from "../../../../lang/JavaEnum.js";
import type { XmlElement } from "../../XmlUtils.js";
import { Castle } from "../../feature/Castle.js";
import { City } from "../../feature/City.js";
import type { Completable } from "../../feature/Completable.js";
import type { Feature } from "../../feature/Feature.js";
import { BooleanAllModifier } from "../../feature/modifier/BooleanAllModifier.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { ScoreCastle } from "../../reducers/ScoreCastle.js";
import { UndeployMeeples } from "../../reducers/UndeployMeeples.js";
import { Capability } from "../Capability.js";
import type { ScoreFeatureReducer } from "../ScoreFeatureReducer.js";
import { GameElementQuery } from "../setup/GameElementQuery.js";
import type { Token } from "../Token.js";
import type { GameState } from "../state/GameState.js";

/** Castles (Bridges, Castles &amp; Bazaars). A 2-tile city with a single open edge
 *  may be converted into a castle that later steals the score of the best feature
 *  completed in its vicinity. */
export class CastleCapability extends Capability<void> {
  /** Marks a city eligible to be a castle base (2-tile, single open edge). */
  static readonly CASTLE_BASE = new BooleanAllModifier("city[castle-base]", new GameElementQuery("castle"));

  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    const tokens = state.getPlayers().length() < 5 ? 3 : 2;
    return state.mapPlayers((ps) =>
      ps.setTokenCountForAllPlayers(CastleCapability.CastleToken.CASTLE, tokens),
    );
  }

  override initFeature(state: GameState, _tileId: string, feature: Feature, xml: XmlElement): Feature {
    if (feature instanceof City) {
      const attr = xml.getAttribute("castle-base");
      const castleForbidden = attr === "false" || attr === "no";
      if (feature.getOpenEdges().size() === 1 && feature.getMultiEdges().isEmpty()) {
        return feature.putModifier(CastleCapability.CASTLE_BASE, !castleForbidden);
      }
    }
    return feature;
  }

  private getOccupiedCastles(state: GameState): Stream<Castle> {
    const placedThisTurn = state.getLastPlaced()!.getPosition();
    return state
      .getFeatures(Castle)
      .filter((c) => c.isOccupied(state))
      .filter((c) => !c.getTilePositions().contains(placedThisTurn)) as Stream<Castle>;
  }

  /** Scores all occupied castles from the best vicinity feature (cascading from
   *  one castle to another). Returns the new state and the castle→reducer map. */
  scoreCastles(
    state: GameState,
    completed: VMap<Completable, ScoreFeatureReducer>,
  ): Tuple2<GameState, VMap<Castle, ScoreFeatureReducer>> {
    const completedTuples: Tuple2<Completable, ScoreFeatureReducer>[] = [];
    for (const t of completed) completedTuples.push(t as Tuple2<Completable, ScoreFeatureReducer>);
    const scored = Arr.ofAll(completedTuples).sortBy(
      (t: Tuple2<Completable, ScoreFeatureReducer>) => -t._2.getFeaturePoints().getPoints(),
    );
    let allScored: VMap<Castle, ScoreFeatureReducer> = HashMap.empty();

    // first round: castles steal from the best completed feature in their vicinity
    let round: Array<Tuple2<Castle, ScoreFeatureReducer>> = [];
    for (const castle of this.getOccupiedCastles(state)) {
      const vicinity = castle.getVicinity();
      for (const t of scored) {
        if (!vicinity.intersect(t._1.getTilePositions()).isEmpty()) {
          const reducer = new ScoreCastle(castle, t._2.getFeaturePoints(), false);
          state = reducer.apply(state);
          state = new UndeployMeeples(castle, false).apply(state);
          round.push(new Tuple2(castle, reducer as unknown as ScoreFeatureReducer));
          break;
        }
      }
    }

    // cascade: a scored castle can feed another adjacent castle
    while (round.length > 0) {
      const cpy = round;
      for (const t of cpy) allScored = allScored.put(t._1, t._2);
      round = [];
      for (const castle of this.getOccupiedCastles(state)) {
        const vicinity = castle.getVicinity();
        for (const t of cpy) {
          if (!vicinity.intersect(t._1.getTilePositions()).isEmpty()) {
            const reducer = new ScoreCastle(castle, t._2.getFeaturePoints(), false);
            state = reducer.apply(state);
            state = new UndeployMeeples(castle, false).apply(state);
            round.push(new Tuple2(castle, reducer as unknown as ScoreFeatureReducer));
            break;
          }
        }
      }
    }

    return new Tuple2(state, allScored);
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CastleCapability {
  export class CastleToken extends JavaEnum implements Token {
    static readonly CASTLE = new CastleToken("CASTLE", 0);
    private static readonly VALUES: readonly CastleToken[] = [CastleToken.CASTLE];
    static values(): readonly CastleToken[] {
      return CastleToken.VALUES;
    }
  }
}

Capability.register(CastleCapability);
