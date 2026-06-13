import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { PlayEventMeta } from "../event/PlayEvent.js";
import { MeepleReturned } from "../event/MeepleReturned.js";
import type { Structure } from "../feature/Structure.js";
import { Builder } from "../figure/Builder.js";
import type { Follower } from "../figure/Follower.js";
import type { Meeple } from "../figure/Meeple.js";
import { Pig } from "../figure/Pig.js";
import type { ReturnMeepleSource } from "../game/ReturnMeepleSource.js";
import type { GameState } from "../game/state/GameState.js";
import type { Reducer } from "./Reducer.js";

/** Base reducer for undeploying meeples (returns to supply) + lonely-special cleanup. */
export abstract class AbstractUndeploy implements Reducer {
  abstract apply(state: GameState): GameState;

  protected undeploy(
    state: GameState,
    meta: PlayEventMeta,
    meeple: Meeple,
    source: FeaturePointer,
    forced: boolean,
    returnMeepleSource: ReturnMeepleSource | null = null,
  ): GameState {
    const deployedMeeples = state.getDeployedMeeples();
    state = state.setDeployedMeeples(deployedMeeples.remove(meeple) as typeof deployedMeeples);
    state = state.appendEvent(new MeepleReturned(meta, meeple, source, forced, returnMeepleSource));
    return state;
  }

  protected undeployLonelySpecials(
    state: GameState,
    meeple: Follower,
    source: FeaturePointer,
    forced: boolean,
  ): GameState {
    const owner = meeple.getPlayer();
    const metaNoPlayer = PlayEventMeta.createWithoutPlayer();
    const feature = state.getStructure(source)!;
    const threatened = feature
      .getMeeples2(state)
      .filter((m) => m._1 instanceof Pig || m._1 instanceof Builder)
      .filter((m) => m._1.getPlayer().equals(owner));

    for (const t of threatened) {
      if (feature.getFollowers(state).find((f) => f.getPlayer().equals(owner)).isEmpty()) {
        state = this.undeploy(state, metaNoPlayer, t._1, t._2, forced);
      }
    }
    return state;
  }
}
