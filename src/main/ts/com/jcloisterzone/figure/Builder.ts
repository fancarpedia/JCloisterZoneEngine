import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Completable } from "../feature/Completable.js";
import type { Structure } from "../feature/Structure.js";
import { isInstanceOfBuilderExtendable } from "../game/capability/trait/BuilderExtendable.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Special } from "./Special.js";

/** The Builder (Traders &amp; Builders) — grants an extra turn. */
export class Builder extends Special {
  static readonly simpleName = "Builder";

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override isDeploymentAllowed(state: GameState, fp: FeaturePointer, feature: Structure): DeploymentCheckResult {
    if (!isInstanceOfBuilderExtendable(feature)) {
      return new DeploymentCheckResult("Builder must be placed on BuilderExtendable feature only.");
    }
    const cf = feature as unknown as Completable;
    if (cf.isCompleted(state)) {
      return new DeploymentCheckResult("Feature is completed.");
    }
    if (!feature.isOccupiedBy(state, this.getPlayer())) {
      return new DeploymentCheckResult("Feature is not occupied by follower.");
    }
    if (
      feature
        .getSpecialMeeples(state)
        .find((m) => m instanceof Builder && m.getPlayer().equals(this.getPlayer()))
        .isDefined()
    ) {
      return new DeploymentCheckResult("Player's second builder is not allowed");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
