import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { PlayEventMeta } from "../event/PlayEvent.js";
import { MeepleDeployed } from "../event/MeepleDeployed.js";
import { Follower } from "../figure/Follower.js";
import type { Meeple } from "../figure/Meeple.js";
import type { GameState } from "../game/state/GameState.js";
import { AbstractUndeploy } from "./AbstractUndeploy.js";

/** Deploys a meeple onto a feature pointer. */
export class DeployMeeple extends AbstractUndeploy {
  constructor(
    private readonly meeple: Meeple,
    private readonly fp: FeaturePointer,
  ) {
    super();
  }

  apply(state: GameState): GameState {
    const feature = state.getStructure(this.fp);
    if (feature === null) {
      throw new Error("There is no feature on " + this.fp);
    }

    const check = this.meeple.isDeploymentAllowed(state, this.fp, feature);
    if (!check.result) {
      throw new Error(check.error ?? "Deployment not allowed");
    }

    const deployedMeeples = state.getDeployedMeeples();
    const movedFrom = deployedMeeples.get(this.meeple).getOrNull();
    state = state.setDeployedMeeples(deployedMeeples.put(this.meeple, this.fp) as typeof deployedMeeples);
    state = state.appendEvent(
      new MeepleDeployed(PlayEventMeta.createWithActivePlayer(state), this.meeple, this.fp, movedFrom),
    );

    if (movedFrom !== null && this.meeple instanceof Follower) {
      state = this.undeployLonelySpecials(state, this.meeple, movedFrom, true);
    }
    return state;
  }
}
