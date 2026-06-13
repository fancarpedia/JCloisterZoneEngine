import type { Player } from "../Player.js";
import { Location } from "../board/Location.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { FlyingMachine } from "../feature/FlyingMachine.js";
import { Garden } from "../feature/Garden.js";
import { Monastery } from "../feature/Monastery.js";
import type { Structure } from "../feature/Structure.js";
import { isInstanceOfTrapFeature } from "../feature/TrapFeature.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Follower } from "./Follower.js";

/** The Abbot (German Monasteries) — deploys on monasteries/gardens. */
export class Abbot extends Follower {
  static readonly simpleName = "Abbot";

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override isDeploymentAllowed(state: GameState, fp: FeaturePointer, feature: Structure): DeploymentCheckResult {
    if (
      !(
        fp.getLocation() === Location.QUARTER_CATHEDRAL ||
        feature instanceof Monastery ||
        feature instanceof Garden ||
        feature instanceof FlyingMachine ||
        isInstanceOfTrapFeature(feature)
      )
    ) {
      return new DeploymentCheckResult("Abbot must be placed only at monastery or garden.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
