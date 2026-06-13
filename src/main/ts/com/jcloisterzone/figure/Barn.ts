import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { Field } from "../feature/Field.js";
import type { Structure } from "../feature/Structure.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Special } from "./Special.js";
import type { TopLeftTranslatedFigurePosition } from "./TopLeftTranslatedFigurePosition.js";

/** The Barn (Abbey & Mayor) — deployed on a field intersection; unaffected by other
 *  barns. Implements TopLeftTranslatedFigurePosition (corner placement). */
import type { UnaffectedByBarn } from "../game/capability/trait/UnaffectedByBarn.js";

export class Barn extends Special implements TopLeftTranslatedFigurePosition, UnaffectedByBarn {
  static readonly simpleName = "Barn";
  isUnaffectedByBarn(): true {
    return true;
  }
  readonly topLeftTranslated = true as const;

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override canBeEatenByDragon(_state: GameState): boolean {
    return false;
  }

  override isDeploymentAllowed(
    state: GameState,
    fp: FeaturePointer,
    feature: Structure,
  ): DeploymentCheckResult {
    if (!(feature instanceof Field)) {
      return new DeploymentCheckResult("The barn must be placed only on a field.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
