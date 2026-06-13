import type { GameState } from "../game/state/GameState.js";

/** A state transition (io.vavr Function1&lt;GameState, GameState&gt;). */
export interface Reducer {
  apply(state: GameState): GameState;
}
