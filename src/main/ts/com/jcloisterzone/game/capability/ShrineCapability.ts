import type { HashMap } from "../../../../io/vavr/Map.js";
import { Location } from "../../board/Location.js";
import type { PlacementOption } from "../../board/PlacementOption.js";
import { Position } from "../../board/Position.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { Tile } from "../../board/Tile.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ScoreEvent, ReceivedPoints } from "../../event/ScoreEvent.js";
import { Monastery } from "../../feature/Monastery.js";
import type { Scoreable } from "../../feature/Scoreable.js";
import { ReturnMeepleSource } from "../ReturnMeepleSource.js";
import type { ScoreFeatureReducer } from "../ScoreFeatureReducer.js";
import { UndeployMeeples } from "../../reducers/UndeployMeeples.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

/** The Cult (shrines) — a shrine and a monastery placed adjacent "challenge" each
 *  other; the first completed wins, the loser scores 0 and is returned. Placement of a
 *  monastery/shrine next to >1 opposite, or next to an already-doubly-challenged
 *  opposite, is forbidden. */
export class ShrineCapability extends Capability<void> {
  private getMonastery(tile: Tile): Monastery | null {
    for (const t of tile.getInitialFeatures()) {
      if (t._2 instanceof Monastery) return t._2;
    }
    return null;
  }

  private getAdjacentMonasteries(state: GameState, pos: Position): Monastery[] {
    const out: Monastery[] = [];
    for (const pt of state.getAdjacentAndDiagonalTiles(pos)) {
      const f = state.getFeature(new FeaturePointer(pt.getPosition(), Monastery as never, Location.I));
      if (f instanceof Monastery) out.push(f);
    }
    return out;
  }

  override isTilePlacementAllowed(state: GameState, tile: Tile, placement: PlacementOption): boolean {
    const monastery = this.getMonastery(tile);
    if (monastery === null) return true;
    const isShrine = monastery.isShrine(state);
    const opposite = this.getAdjacentMonasteries(state, placement.getPosition()).filter(
      (c) => c.isShrine(state) !== isShrine,
    );
    if (opposite.length > 1) return false; // next to >1 opposite-type monastery
    if (opposite.length === 1) {
      // the opposite must not already be challenged by a same-type-as-`monastery` one
      const oppositePos = opposite[0].getPlace().getPosition();
      const sameType = this.getAdjacentMonasteries(state, oppositePos).filter(
        (c) => c.isShrine(state) === isShrine,
      );
      if (sameType.length > 0) return false;
    }
    return true;
  }

  override onTurnScoring(
    state: GameState,
    completed: HashMap<Scoreable, ScoreFeatureReducer>,
  ): GameState {
    const completedMonasteries: Monastery[] = [];
    for (const t of completed) {
      if (t._2.getOwners().nonEmpty() && t._1 instanceof Monastery) completedMonasteries.push(t._1);
    }
    const completedSet = completedMonasteries[0] ?? null;

    const challenged: Monastery[] = [];
    const seen = new globalThis.Set<Monastery>();
    for (const monastery of completedMonasteries) {
      const pos = monastery.getPlace().getPosition();
      for (const c of this.getAdjacentMonasteries(state, pos)) {
        if (c.isShrine(state) === monastery.isShrine(state)) continue;
        if (!c.isOpen(state)) continue;
        if (seen.has(c)) continue;
        seen.add(c);
        challenged.push(c);
      }
    }

    for (const monastery of challenged) {
      const meeple = monastery.getMeeples(state).getOrNull();
      if (meeple === null) continue;
      const expr = new PointsExpression(
        monastery.isShrine(state) ? "shrine.challenged" : "monastery.challenged",
        new ExprItem("shrine-challenge", 0),
      );
      state = state.appendEvent(
        new ScoreEvent(new ReceivedPoints(expr, meeple.getPlayer(), meeple.getDeployment(state)!), true, false),
      );
      state = new UndeployMeeples(
        monastery,
        true,
        ReturnMeepleSource.MONASTERY_SHRINE_CHALLENGE,
        completedSet as unknown as Monastery,
      ).apply(state);
    }
    return state;
  }
}

Capability.register(ShrineCapability);
