import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { Field } from "../feature/Field.js";
import type { Structure } from "../feature/Structure.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Special } from "./Special.js";

/** A pig (Traders &amp; Builders) — boosts a field the player already occupies. */
export class Pig extends Special {
  static readonly simpleName = "Pig";

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override isDeploymentAllowed(
    state: GameState,
    fp: FeaturePointer,
    feature: Structure,
  ): DeploymentCheckResult {
    if (!(feature instanceof Field)) {
      return new DeploymentCheckResult("Pig must be placed on a field only.");
    }
    if (!feature.isOccupiedBy(state, this.getPlayer())) {
      return new DeploymentCheckResult("Field is not occupied by follower.");
    }
    if (
      feature
        .getSpecialMeeples(state)
        .find((m) => m instanceof Pig && m.getPlayer().equals(this.getPlayer()))
        .isDefined()
    ) {
      return new DeploymentCheckResult("Player's second pig is not allowed");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
