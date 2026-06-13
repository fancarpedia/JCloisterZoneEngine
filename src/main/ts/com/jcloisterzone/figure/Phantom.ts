import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { Garden } from "../feature/Garden.js";
import type { Structure } from "../feature/Structure.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { SmallFollower } from "./SmallFollower.js";

/** The Phantom — a second follower deployed in the same turn (Inns &amp; Cathedrals). */
export class Phantom extends SmallFollower {
  static readonly simpleName = "Phantom";

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override isDeploymentAllowed(
    state: GameState,
    fp: FeaturePointer,
    feature: Structure,
  ): DeploymentCheckResult {
    if (feature instanceof Garden) {
      return new DeploymentCheckResult("Cannot place phantom on the garden.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
