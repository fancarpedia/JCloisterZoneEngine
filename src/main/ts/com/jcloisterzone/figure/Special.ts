import type { Player } from "../Player.js";
import { Location } from "../board/Location.js";
import { simpleName } from "../../../lang/Class.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Structure } from "../feature/Structure.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Meeple } from "./Meeple.js";

/** A special (non-follower) meeple — barn, builder, pig, mayor, wagon, ... */
export abstract class Special extends Meeple {
  constructor(id: string, player: Player) {
    super(id, player);
  }

  override isSpecial(): boolean {
    return true;
  }

  override isDeploymentAllowed(
    state: GameState,
    fp: FeaturePointer,
    feature: Structure,
  ): DeploymentCheckResult {
    const feat = fp.getFeature();
    if (fp.getLocation() === Location.AS_ABBOT || (feat !== null && simpleName(feat) === "FlyingMachine")) {
      return new DeploymentCheckResult("only follower is allowed");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
