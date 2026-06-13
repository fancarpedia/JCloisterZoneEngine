import type { GameState } from "../state/GameState.js";

/** A predicate over the game setup/state (io.vavr Function1&lt;GameState,Boolean&gt;). */
export interface SetupQuery {
  apply(state: GameState): boolean;
}
