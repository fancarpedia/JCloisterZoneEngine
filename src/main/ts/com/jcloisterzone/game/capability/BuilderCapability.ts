import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";
import { BuilderState } from "./BuilderState.js";

/** Builder (Traders & Builders): extending one of your own features that holds your builder
 *  grants a second tile-placement turn part. The model tracks the per-turn state. */
export class BuilderCapability extends Capability<BuilderState> {
  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    return this.setModel(state, BuilderState.UNUSED);
  }

  /** Called when the placed tile extends a feature the builder sits on. */
  useBuilder(state: GameState): GameState {
    return this.updateModel(state, (bs) => (bs === BuilderState.UNUSED ? BuilderState.USED : bs));
  }

  override onTurnPartCleanUp(state: GameState): GameState {
    return this.updateModel(state, (bs) => {
      if (bs === BuilderState.USED) return BuilderState.SECOND_TURN;
      if (bs === BuilderState.SECOND_TURN) return BuilderState.UNUSED;
      return bs;
    });
  }
}

Capability.register(BuilderCapability);
