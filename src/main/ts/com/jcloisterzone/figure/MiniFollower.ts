import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { Garden } from "../feature/Garden.js";
import type { Scoreable } from "../feature/Scoreable.js";
import type { Structure } from "../feature/Structure.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Follower } from "./Follower.js";

/**
 * Mini Meeple (fan expansion) — a follower of power 0.5.
 *
 * Unlike every other figure, a Mini is NOT part of the starting supply: players begin with
 * none at all, and MiniMeepleCapability creates one and hands it to a player each time they
 * fill a hole with a regular tile, up to the per-game cap. So there is nothing to gate here —
 * if a player has one, they own it and may deploy it.
 *
 * Extends Follower directly, NOT SmallFollower: Phantom and Ringmaster do that, and several
 * places test `constructor === SmallFollower` exactly (Player.getMeepleFromSupply,
 * LegacyRanking) — subclassing it would make a Mini read as a plain follower there.
 */
export class MiniFollower extends Follower {
  static readonly simpleName = "MiniFollower";

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override getPower(state: GameState, feature: Scoreable): number {
    return 0.5;
  }

  override isDeploymentAllowed(
    state: GameState,
    fp: FeaturePointer,
    feature: Structure,
  ): DeploymentCheckResult {
    if (feature instanceof Garden) {
      return new DeploymentCheckResult("Cannot place mini follower on the garden.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
