import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { Field } from "../feature/Field.js";
import type { Structure } from "../feature/Structure.js";
import type { UnaffectedByBarn } from "../game/capability/trait/UnaffectedByBarn.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Special } from "./Special.js";

/** The Shepherd (Hills &amp; Sheep) — placed on fields, herds sheep. */
export class Shepherd extends Special implements UnaffectedByBarn {
  static readonly simpleName = "Shepherd";
  isUnaffectedByBarn(): true {
    return true;
  }

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override interactingWithOtherMeeples(): boolean {
    return false;
  }

  override isDeploymentAllowed(state: GameState, fp: FeaturePointer, feature: Structure): DeploymentCheckResult {
    if (!(feature instanceof Field)) {
      return new DeploymentCheckResult("Shepherd must be placed on a field only.");
    }
    if (feature.getSpecialMeeples(state).filter((f) => f instanceof Shepherd).nonEmpty()) {
      return new DeploymentCheckResult("Field is already occupied by Shepherd.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
