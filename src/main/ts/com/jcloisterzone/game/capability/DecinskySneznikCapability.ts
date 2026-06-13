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
import { DecinskySneznik } from "../../figure/DecinskySneznik.js";
import { MeepleAction } from "../../action/MeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import { UndeployMeeple } from "../../reducers/UndeployMeeple.js";
import { Capability } from "../Capability.js";
import type { ScoreFeatureReducer } from "../ScoreFeatureReducer.js";
import type { GameState } from "../state/GameState.js";

const TILES_REQUIRED = 5;

/** Děčínský Sněžník (mini-expansion) — deploy on a just-placed tile's field; scores
 *  the deployed tile + orthogonal neighbours (5 full; an incomplete final scores 0). */
export class DecinskySneznikCapability extends Capability<void> {
  override onActionPhaseEntered(state: GameState): GameState {
    const fig = state
      .getActivePlayer()!
      .getMeeplesFromSupply(state, Vector.of(DecinskySneznik as never))
      .getOrNull();
    if (fig === null) return state;
    const pos = state.getLastPlaced()!.getPosition();
    const fps: FeaturePointer[] = [];
    for (const t of state.getTileFeatures2(pos, Field)) fps.push(t._1);
    if (fps.length === 0) return state;
    return state.appendAction(new MeepleAction(fig, HashSet.ofAll(fps)) as unknown as PlayerAction<unknown>);
  }

  override onTurnScoring(_s: GameState, _c: HashMap<Scoreable, ScoreFeatureReducer>): GameState {
    return this.score(_s, false);
  }

  override onFinalScoring(state: GameState): GameState {
    return this.score(state, true);
  }

  private score(state: GameState, isFinal: boolean): GameState {
    const figs: DecinskySneznik[] = [];
    for (const t of state.getDeployedMeeples()) if (t._1 instanceof DecinskySneznik) figs.push(t._1);

    for (const fig of figs) {
      const tiles = fig.getRangeTiles(state).toArray();
      if (isFinal || tiles.length === TILES_REQUIRED) {
        const positions: Set<Position> = HashSet.ofAll(tiles.map((tile) => tile.getPosition()));
        const points = isFinal ? 0 : tiles.length;
        const expr = new PointsExpression(
          isFinal ? "decinsky-sneznik.incomplete" : "decinsky-sneznik",
          new ExprItem(tiles.length, "tiles", points),
        );
        const src = new ScoreMeeplePositionsPointer(fig.getDeployment(state)!, fig.getId(), positions);
        // main points use isFinal=false (Java's 2-arg AddPoints) → grouped under the turn
        state = new AddPoints(new ReceivedPoints(expr, fig.getPlayer(), src), false).apply(state);

        let bonus: List<ReceivedPoints> = List.empty<ReceivedPoints>();
        for (const cap of state.getCapabilities().toSeq()) {
          bonus = cap.appendSpecialFiguresBonusPoints(state, bonus, fig, isFinal);
        }
        state = new AddPoints(bonus, true, isFinal).apply(state);

        if (!isFinal) state = new UndeployMeeple(fig, false).apply(state);
      }
    }
    return state;
  }
}

Capability.register(DecinskySneznikCapability);
