import type { GameState } from "../game/state/GameState.js";

/** A heuristic that scores a game state from one player's perspective (higher = better).
 *  Port of Java's `GameStateRanking extends Function1<GameState, Double>`. */
export interface GameStateRanking {
  apply(state: GameState): number;
}
