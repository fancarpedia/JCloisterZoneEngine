import { List, Stream } from "../../../io/vavr/SeqTypes.js";
import { HashSet } from "../../../io/vavr/Set.js";
import { type ClassToken } from "../../../lang/Class.js";
import type { Player } from "../Player.js";
import { Location } from "../board/Location.js";
import type { Position } from "../board/Position.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { ScorePositionsFeaturePointer } from "../board/pointer/ScorePositionsFeaturePointer.js";
import { ExprItem } from "../event/ExprItem.js";
import { PointsExpression } from "../event/PointsExpression.js";
import { ReceivedPoints } from "../event/ScoreEvent.js";
import { City } from "../feature/City.js";
import { type Completable, isInstanceOfCompletable } from "../feature/Completable.js";
import { Field } from "../feature/Field.js";
import { Garden } from "../feature/Garden.js";
import { YagaHut } from "../feature/YagaHut.js";
import { FishHut } from "../feature/FishHut.js";
import { Monastery } from "../feature/Monastery.js";
import { River } from "../feature/River.js";
import { Road } from "../feature/Road.js";
import type { Scoreable } from "../feature/Scoreable.js";

import { Barn } from "../figure/Barn.js";
import { Castle } from "../feature/Castle.js";
import { ReturnMeepleSource } from "../game/ReturnMeepleSource.js";
import type { GameState } from "../game/state/GameState.js";
import { AddPoints } from "./AddPoints.js";
import type { Reducer } from "./Reducer.js";
import { ScoreCastle } from "./ScoreCastle.js";
import { ScoreCompletable } from "./ScoreCompletable.js";
import { ScoreField } from "./ScoreField.js";
import { ScoreFieldBarn } from "./ScoreFieldBarn.js";
import { ScoreFieldWhenBarnIsConnected } from "./ScoreFieldWhenBarnIsConnected.js";
import { UndeployMeeples } from "./UndeployMeeples.js";

/** Final (end-of-game) scoring of all occupied incomplete features. */
export class FinalScoring implements Reducer {
  private getOccupiedScoreables<T extends Scoreable>(state: GameState, cls: ClassToken<T>): Stream<T> {
    return state.getFeatures(cls).filter((c) => c.isOccupied(state)) as Stream<T>;
  }

  private getContinuousRowSize(state: GameState, beginning: Position, direction: Location): number {
    let pos = beginning.add(direction);
    let size = 0;
    while (state.getPlacedTiles().containsKey(pos)) {
      size++;
      pos = pos.add(direction);
    }
    return size;
  }

  private getSpecialMonasteryPoints(state: GameState, monastery: Monastery): PointsExpression {
    const pos = monastery.getPosition();
    let items: List<ExprItem> = List.of(new ExprItem(1, "tiles", 1));
    for (const loc of Location.SIDES) {
      const size = this.getContinuousRowSize(state, pos, loc);
      items = items.append(new ExprItem(size, "tiles." + loc.toString(), size)) as List<ExprItem>;
    }
    return new PointsExpression("special-monastery", items).appendAll(monastery.getLittleBuildingPoints(state));
  }

  apply(state: GameState): GameState {
    // Occupied completables (City/Road/River/Monastery/Garden) score incomplete.
    for (const f of state.getFeatures()) {
      if (isInstanceOfCompletable(f) && (f as unknown as Scoreable).isOccupied(state)) {
        state = new ScoreCompletable(f, true).apply(state);
      }
    }

    // Occupied castles score nothing at game end (castle.incomplete) but still undeploy.
    for (const castle of this.getOccupiedScoreables<Castle>(state, Castle)) {
      state = new ScoreCastle(castle, new PointsExpression("castle.incomplete", List.empty()), true).apply(state);
    }

    // Special monasteries (German monasteries) — empty for basic.
    const specialMonasteries = state
      .getFeatures()
      .filter((f) => f instanceof Monastery && (f as Monastery).isSpecialMonastery(state))
      .map((f) => f as Monastery);
    for (const monastery of specialMonasteries) {
      const expr = this.getSpecialMonasteryPoints(state, monastery);
      let receivedPoints: List<ReceivedPoints> = List.empty<ReceivedPoints>();
      for (const player of monastery.getMonasteryOwners(state)) {
        const follower = monastery.getMonasterySampleFollower(state, player)!;
        receivedPoints = receivedPoints.append(
          new ReceivedPoints(
            expr,
            player,
            new ScorePositionsFeaturePointer(
              follower.getDeployment(state) as FeaturePointer,
              HashSet.ofAll(monastery.getRangeTilesWithFeature(state).map((t) => t.getPosition())),
            ),
          ),
        ) as List<ReceivedPoints>;
      }
      if (!receivedPoints.isEmpty()) {
        state = new AddPoints(receivedPoints, true, true).apply(state);
      }
      // figure bonus points (emits a — possibly empty — ScoreEvent, matching Java)
      let bonusPoints: List<ReceivedPoints> = List.empty<ReceivedPoints>();
      for (const cap of state.getCapabilities().toSeq()) {
        bonusPoints = cap.appendFiguresBonusPoints(state, bonusPoints, monastery, true);
      }
      state = new AddPoints(bonusPoints, true, true).apply(state);
    }

    // Fields
    for (const field of this.getOccupiedScoreables<Field>(state, Field)) {
      const hasBarn = field.getSpecialMeeples(state).find((m) => m instanceof Barn).isDefined();
      const hasFollowers = !field.getFollowers(state).isEmpty();
      if (hasBarn) {
        if (hasFollowers) {
          // followers deployed (e.g. via City of Carcassonne) before final scoring
          state = new ScoreFieldWhenBarnIsConnected(field).apply(state);
          state = new UndeployMeeples(field, true, ReturnMeepleSource.BARN_FIELD_JOIN).apply(state);
        }
        state = new ScoreFieldBarn(field, true).apply(state);
      } else if (hasFollowers) {
        state = new ScoreField(field, true).apply(state);
      }
    }

    for (const cap of state.getCapabilities().toSeq()) {
      state = cap.onFinalScoring(state);
    }
    return state;
  }
}
