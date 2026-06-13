import type { Player } from "../Player.js";
import { Location } from "../board/Location.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { Field } from "../feature/Field.js";
import { Garden } from "../feature/Garden.js";
import { River } from "../feature/River.js";
import type { Structure } from "../feature/Structure.js";
import { Tower } from "../feature/Tower.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Follower } from "./Follower.js";

/** The Wagon (Abbey &amp; Mayor) — moves between connected features. */
export class Wagon extends Follower {
  static readonly simpleName = "Wagon";

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override isDeploymentAllowed(state: GameState, fp: FeaturePointer, feature: Structure): DeploymentCheckResult {
    if (fp.getLocation() === Location.QUARTER_MARKET) {
      return new DeploymentCheckResult("Cannot place wagon on the market quarter.");
    }
    if (feature instanceof Tower) {
      return new DeploymentCheckResult("Cannot place wagon on the tower.");
    }
    if (feature instanceof Field) {
      return new DeploymentCheckResult("Cannot place wagon on the field.");
    }
    if (feature instanceof Garden) {
      return new DeploymentCheckResult("Cannot place wagon on the garden.");
    }
    if (feature instanceof River) {
      return new DeploymentCheckResult("Cannot place wagon on the river.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
