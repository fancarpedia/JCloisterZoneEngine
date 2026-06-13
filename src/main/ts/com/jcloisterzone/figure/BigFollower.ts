import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { Garden } from "../feature/Garden.js";
import type { Scoreable } from "../feature/Scoreable.js";
import type { Structure } from "../feature/Structure.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Follower } from "./Follower.js";

/** A big follower (power 2). */
export class BigFollower extends Follower {
  static readonly simpleName = "BigFollower";

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override getPower(state: GameState, feature: Scoreable): number {
    return 2;
  }

  override isDeploymentAllowed(state: GameState, fp: FeaturePointer, feature: Structure): DeploymentCheckResult {
    if (feature instanceof Garden) {
      return new DeploymentCheckResult("Cannot place big follower on the garden.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
