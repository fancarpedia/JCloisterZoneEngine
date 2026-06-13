import type { Player } from "../Player.js";
import { Location } from "../board/Location.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { City } from "../feature/City.js";
import { FlyingMachine } from "../feature/FlyingMachine.js";
import type { Scoreable } from "../feature/Scoreable.js";
import type { Structure } from "../feature/Structure.js";
import { isInstanceOfTrapFeature } from "../feature/TrapFeature.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Follower } from "./Follower.js";

/** The Mayor (Count, King &amp; Robber) — power = city pennants. */
export class Mayor extends Follower {
  static readonly simpleName = "Mayor";

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override getPower(state: GameState, feature: Scoreable): number {
    if (feature instanceof City) {
      if (feature.hasModifier(state, City.ELIMINATED_PENNANTS)) {
        return 0;
      }
      return feature.getModifier(state, City.PENNANTS, 0);
    }
    return 0; // not a City -> Castle, Mayor has no power
  }

  override isDeploymentAllowed(state: GameState, fp: FeaturePointer, feature: Structure): DeploymentCheckResult {
    if (
      !(
        fp.getLocation() === Location.QUARTER_CASTLE ||
        feature instanceof City ||
        feature instanceof FlyingMachine ||
        isInstanceOfTrapFeature(feature)
      )
    ) {
      return new DeploymentCheckResult("Mayor must be placed in city only.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }
}
