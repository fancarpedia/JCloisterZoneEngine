import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { Acrobats } from "../feature/Acrobats.js";
import type { Structure } from "../feature/Structure.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { SmallFollower } from "./SmallFollower.js";

/** The Ringmaster (Under the Big Top). */
export class Ringmaster extends SmallFollower {
  static readonly simpleName: string = "Ringmaster";

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override isDeploymentAllowed(state: GameState, fp: FeaturePointer, feature: Structure): DeploymentCheckResult {
    if (feature instanceof Acrobats) {
      return new DeploymentCheckResult("Cannot place ringmaster on the acrobats space.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
