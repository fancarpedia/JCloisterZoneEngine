import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { MeeplePointer } from "../../board/pointer/MeeplePointer.js";
import { Road } from "../../feature/Road.js";
import { ReturnMeepleAction } from "../../action/ReturnMeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { Capability } from "../Capability.js";
import { ReturnMeepleSource } from "../ReturnMeepleSource.js";
import { Flag } from "../state/Flag.js";
import type { GameState } from "../state/GameState.js";

/** Robber's Son (fan expansion) — the road counterpart of Princess: placing a tile that
 *  extends a road carrying the robber's-son icon lets the turn player remove a follower from
 *  that road instead of deploying. */
export class RobbersSonCapability extends Capability<void> {
  override onActionPhaseEntered(state: GameState): GameState {
    if (state.getFlags().contains(Flag.NO_PHANTOM)) {
      return state;
    }
    const lastTile = state.getLastPlaced()!;
    let options: Set<MeeplePointer> = HashSet.empty<MeeplePointer>();
    for (const t of state.getTileFeatures2(lastTile.getPosition())) {
      if (!(t._2 instanceof Road)) continue;
      const part = lastTile.getInitialFeaturePartOf(t._1.getLocation()!)!._2 as Road;
      if (!part.hasModifier(state, Road.ROBBERS_SON)) continue;
      for (const ft of (t._2 as Road).getFollowers2(state)) {
        options = options.add(new MeeplePointer(ft));
      }
    }

    if (options.isEmpty()) {
      return state;
    }
    return state.appendAction(
      new ReturnMeepleAction(options, ReturnMeepleSource.ROBBERS_SON) as unknown as PlayerAction<unknown>,
    );
  }
}

Capability.register(RobbersSonCapability);
