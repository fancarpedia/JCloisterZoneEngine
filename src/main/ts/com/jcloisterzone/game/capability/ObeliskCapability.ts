import type { HashMap } from "../../../../io/vavr/Map.js";
import { List } from "../../../../io/vavr/SeqTypes.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import type { Tuple2 } from "../../../../io/vavr/Tuple.js";
import { Corner } from "../../board/Corner.js";
import { Location } from "../../board/Location.js";
import { Position } from "../../board/Position.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { ScoreMeeplePositionsPointer } from "../../board/pointer/ScoreMeeplePositionsPointer.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { Field } from "../../feature/Field.js";
import type { Feature } from "../../feature/Feature.js";
import type { Scoreable } from "../../feature/Scoreable.js";
import { Obelisk } from "../../figure/Obelisk.js";
import { MeepleAction } from "../../action/MeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import { UndeployMeeple } from "../../reducers/UndeployMeeple.js";
import { Capability } from "../Capability.js";
import type { ScoreFeatureReducer } from "../ScoreFeatureReducer.js";
import type { GameState } from "../state/GameState.js";

const TILES_REQUIRED = 16;

/** Obelisk (mini-expansion). Model: the FeaturePointer of the just-placed obelisk.
 *  Scores 1 point per tile within its 4×4 range, at end of game or once it's full. */
export class ObeliskCapability extends Capability<FeaturePointer | null> {
  override onActionPhaseEntered(state: GameState): GameState {
    const player = state.getPlayerActions()!.getPlayer();
    const obelisk = player.getMeepleFromSupply(state, Obelisk as never);
    if (obelisk === null) return state;

    const pos = state.getLastPlaced()!.getPosition();
    const corners = [
      pos,
      new Position(pos.x + 1, pos.y),
      new Position(pos.x, pos.y + 1),
      new Position(pos.x + 1, pos.y + 1),
    ];
    const options: FeaturePointer[] = [];
    for (const p of corners) {
      const t = this.getCornerFeature(state, p);
      if (t !== null) options.push(t._1);
    }
    if (options.length === 0) return state;
    return state.appendAction(
      new MeepleAction(obelisk, HashSet.ofAll(options)) as unknown as PlayerAction<unknown>,
    );
  }

  override onTurnPartCleanUp(state: GameState): GameState {
    return this.setModel(state, null);
  }

  override onTurnScoring(
    state: GameState,
    _completed: HashMap<Scoreable, ScoreFeatureReducer>,
  ): GameState {
    return this.scoreObelisks(state, false);
  }

  override onFinalScoring(state: GameState): GameState {
    return this.scoreObelisks(state, true);
  }

  private scoreObelisks(state: GameState, isFinal: boolean): GameState {
    const obelisks: Obelisk[] = [];
    for (const t of state.getDeployedMeeples()) if (t._1 instanceof Obelisk) obelisks.push(t._1);

    for (const obelisk of obelisks) {
      const tiles = obelisk.getRangeTiles(state).toArray();
      if (isFinal || tiles.length === TILES_REQUIRED) {
        const positions: Set<Position> = HashSet.ofAll(tiles.map((tile) => tile.getPosition()));
        const expr = new PointsExpression(
          isFinal ? "obelisk.incomplete" : "obelisk",
          new ExprItem(tiles.length, "tiles", tiles.length),
        );
        const source = new ScoreMeeplePositionsPointer(
          obelisk.getDeployment(state)!,
          obelisk.getId(),
          positions,
        );
        // main points use isFinal=false (Java's 2-arg AddPoints) → grouped under the turn
        state = new AddPoints(new ReceivedPoints(expr, obelisk.getPlayer(), source), false).apply(state);

        let bonus: List<ReceivedPoints> = List.empty<ReceivedPoints>();
        for (const cap of state.getCapabilities().toSeq()) {
          bonus = cap.appendSpecialFiguresBonusPoints(state, bonus, obelisk, isFinal);
        }
        state = new AddPoints(bonus, true, isFinal).apply(state);

        if (!isFinal) {
          state = new UndeployMeeple(obelisk, false).apply(state);
        }
      }
    }
    return state;
  }

  private containsCorner(t: Tuple2<FeaturePointer, Feature> | null, c: Corner): boolean {
    return t !== null && t._1.getLocation()!.getCorners().contains(c);
  }

  private getCornerFeature(state: GameState, pos: Position): Tuple2<FeaturePointer, Feature> | null {
    let t = state.getFeaturePartOf2(new FeaturePointer(new Position(pos.x - 1, pos.y - 1), Field as never, Location.SL));
    if (!this.containsCorner(t, Corner.SE)) return null;
    t = state.getFeaturePartOf2(new FeaturePointer(new Position(pos.x, pos.y - 1), Field as never, Location.WL));
    if (!this.containsCorner(t, Corner.SW)) return null;
    t = state.getFeaturePartOf2(new FeaturePointer(new Position(pos.x - 1, pos.y), Field as never, Location.EL));
    if (!this.containsCorner(t, Corner.NE)) return null;
    t = state.getFeaturePartOf2(new FeaturePointer(pos, Field as never, Location.NL));
    if (!this.containsCorner(t, Corner.NW)) return null;
    return t;
  }
}

Capability.register(ObeliskCapability);
