import type { Tuple2 } from "../../../../io/vavr/Tuple.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { Corner } from "../../board/Corner.js";
import { Location } from "../../board/Location.js";
import { Position } from "../../board/Position.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { Feature } from "../../feature/Feature.js";
import { Field } from "../../feature/Field.js";
import { Barn } from "../../figure/Barn.js";
import { MeepleAction } from "../../action/MeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { Capability } from "../Capability.js";
import { Rule } from "../Rule.js";
import type { GameState } from "../state/GameState.js";

/** Barn (Abbey &amp; Mayor) — a special meeple placed on a field-corner intersection.
 *  Model: the FeaturePointer of the just-placed barn (consumed by ScoringPhase). */
export class BarnCapability extends Capability<FeaturePointer | null> {
  override onActionPhaseEntered(state: GameState): GameState {
    const player = state.getPlayerActions()!.getPlayer();
    const barn = player.getMeepleFromSupply(state, Barn as never);
    if (barn === null) return state;

    const pos = state.getLastPlaced()!.getPosition();
    // By convention the barn action's pointer points to the top-left corner of the
    // four-tile intersection at (pos, pos+x, pos+y, pos+xy).
    const corners = [
      pos,
      new Position(pos.x + 1, pos.y),
      new Position(pos.x, pos.y + 1),
      new Position(pos.x + 1, pos.y + 1),
    ];
    const occupiedAllowed = state.getStringRule(Rule.BARN_PLACEMENT) === "occupied";
    const options: FeaturePointer[] = [];
    for (const p of corners) {
      const t = this.getCornerFeature(state, p);
      if (t === null) continue;
      const field = t._2 as Field;
      if (
        occupiedAllowed ||
        field.getSpecialMeeples(state).find((m) => m instanceof Barn).isEmpty()
      ) {
        options.push(t._1);
      }
    }
    if (options.length === 0) return state;
    const optionSet: Set<FeaturePointer> = HashSet.ofAll(options);
    return state.appendAction(new MeepleAction(barn, optionSet) as unknown as PlayerAction<unknown>);
  }

  override onTurnPartCleanUp(state: GameState): GameState {
    return this.setModel(state, null);
  }

  private containsCorner(t: Tuple2<FeaturePointer, Feature> | null, c: Corner): boolean {
    return t !== null && t._1.getLocation()!.getCorners().contains(c);
  }

  /** The field touching the SE/SW/NE/NW corners of the four tiles meeting at the
   *  intersection above-left of {@code pos}, or null if they aren't all the one field. */
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

Capability.register(BarnCapability);
