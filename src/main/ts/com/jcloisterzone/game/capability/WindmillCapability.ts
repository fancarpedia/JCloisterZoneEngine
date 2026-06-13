import type { HashMap } from "../../../../io/vavr/Map.js";
import { List, Vector } from "../../../../io/vavr/SeqTypes.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { Position } from "../../board/Position.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { ScoreMeeplePositionsPointer } from "../../board/pointer/ScoreMeeplePositionsPointer.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { Field } from "../../feature/Field.js";
import type { Scoreable } from "../../feature/Scoreable.js";
import { Windmill } from "../../figure/Windmill.js";
import { MeepleAction } from "../../action/MeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import { UndeployMeeple } from "../../reducers/UndeployMeeple.js";
import { Capability } from "../Capability.js";
import type { ScoreFeatureReducer } from "../ScoreFeatureReducer.js";
import type { GameState } from "../state/GameState.js";

const TILES_REQUIRED = 9;

/** Windmill (mini-expansion) — deploy on a just-placed tile's field; scores its range. */
export class WindmillCapability extends Capability<void> {
  override onActionPhaseEntered(state: GameState): GameState {
    const windmill = state.getActivePlayer()!.getMeeplesFromSupply(state, Vector.of(Windmill as never)).getOrNull();
    if (windmill === null) return state;
    const pos = state.getLastPlaced()!.getPosition();
    const fps: FeaturePointer[] = [];
    for (const t of state.getTileFeatures2(pos, Field)) fps.push(t._1);
    if (fps.length === 0) return state;
    return state.appendAction(new MeepleAction(windmill, HashSet.ofAll(fps)) as unknown as PlayerAction<unknown>);
  }

  override onTurnScoring(_s: GameState, _c: HashMap<Scoreable, ScoreFeatureReducer>): GameState {
    return this.score(_s, false);
  }

  override onFinalScoring(state: GameState): GameState {
    return this.score(state, true);
  }

  private score(state: GameState, isFinal: boolean): GameState {
    const windmills: Windmill[] = [];
    for (const t of state.getDeployedMeeples()) if (t._1 instanceof Windmill) windmills.push(t._1);

    for (const windmill of windmills) {
      const tiles = windmill.getRangeTiles(state).toArray();
      if (isFinal || tiles.length === TILES_REQUIRED) {
        const positions: Set<Position> = HashSet.ofAll(tiles.map((tile) => tile.getPosition()));
        const expr = new PointsExpression(
          isFinal ? "windmill.incomplete" : "windmill",
          new ExprItem(tiles.length, "tiles", tiles.length),
        );
        const src = new ScoreMeeplePositionsPointer(windmill.getDeployment(state)!, windmill.getId(), positions);
        // main points use isFinal=false (Java's 2-arg AddPoints) → grouped under the turn
        state = new AddPoints(new ReceivedPoints(expr, windmill.getPlayer(), src), false).apply(state);

        let bonus: List<ReceivedPoints> = List.empty<ReceivedPoints>();
        for (const cap of state.getCapabilities().toSeq()) {
          bonus = cap.appendSpecialFiguresBonusPoints(state, bonus, windmill, isFinal);
        }
        state = new AddPoints(bonus, true, isFinal).apply(state);

        if (!isFinal) state = new UndeployMeeple(windmill, false).apply(state);
      }
    }
    return state;
  }
}

Capability.register(WindmillCapability);
