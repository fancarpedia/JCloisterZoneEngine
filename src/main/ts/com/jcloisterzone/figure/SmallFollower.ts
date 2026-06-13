import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { Garden } from "../feature/Garden.js";
import type { Structure } from "../feature/Structure.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Follower } from "./Follower.js";

/** The basic small follower. */
export class SmallFollower extends Follower {
  static readonly simpleName: string = "SmallFollower";

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override isDeploymentAllowed(
    state: GameState,
    fp: FeaturePointer,
    feature: Structure,
  ): DeploymentCheckResult {
    if (feature instanceof Garden) {
      return new DeploymentCheckResult("Cannot place small follower on the garden.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
