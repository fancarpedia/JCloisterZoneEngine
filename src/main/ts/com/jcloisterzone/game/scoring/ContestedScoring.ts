import type { Map as VMap } from "../../../../io/vavr/Map.js";
import type { Tuple2 } from "../../../../io/vavr/Tuple.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { Wagon } from "../../figure/Wagon.js";
import type { Completable } from "../../feature/Completable.js";
import type { Scoreable } from "../../feature/Scoreable.js";
import type { ScoreFeatureReducer } from "../ScoreFeatureReducer.js";
import type { GameState } from "../state/GameState.js";

/**
 * A capability under which the ORDER in which completed features are scored can change the result,
 * so the turn player has to choose it (SCORE_FIRST).
 *
 * ScoringPhase drives the process and knows nothing about why the order matters; a capability
 * implementing this tells it which features are contested and what scoring a feature triggers.
 * Castles (Bridges, Castles & Bazaars) are the first: a castle takes the points of the first
 * feature scored in its vicinity. A future expansion implements the same two methods and gets the
 * choice, the message, the never-undoable rule and the client picker without touching the phase.
 */
export interface ContestedScoring {
  /** Marker for the duck-typed guard below. */
  readonly contestedScoring: true;

  /**
   * Of the completed features not yet scored, the ones whose order the turn player must decide.
   * Must return a subset of `pending` (the same objects). Empty means nothing is in question.
   */
  contestedFeatures(state: GameState, pending: readonly Completable[]): Completable[];

  /**
   * Score whatever the given, just-scored features trigger (castles beside them, and any chain
   * those castles start). Returns the new state and the extra scored entries, which the phase
   * passes on to onTurnScoring with everything else scored this turn.
   */
  scoreTriggered(
    state: GameState,
    scored: VMap<Completable, ScoreFeatureReducer>,
  ): Tuple2<GameState, VMap<Scoreable, ScoreFeatureReducer>>;
}

/** Runtime guard (TS interfaces are erased) - duck-typed on the marker member. */
export function isInstanceOfContestedScoring(c: unknown): c is ContestedScoring {
  return (c as { contestedScoring?: unknown } | null)?.contestedScoring === true;
}

/**
 * Scoring progress kept in GameState while ScoringPhase waits for SCORE_FIRST.
 *
 * It has to live in state, not on the phase: phases are shared objects, and the AI simulates moves
 * by applying the reducer to copies of state, so anything on the phase instance would leak between
 * simulations; replay and save/load restore GameState alone. Plain immutable data - every update
 * builds a new session.
 */
export interface ScoringSession {
  /** Completed features not yet scored, one pointer each. */
  readonly pending: readonly FeaturePointer[];
  /** Everything scored so far this turn, for onTurnScoring (Goldmines reads castles too). */
  readonly scored: VMap<Scoreable, ScoreFeatureReducer>;
  /** Wagons deployed when scoring began, to tell which ones scoring returned. */
  readonly wagonsBefore: readonly (readonly [Wagon, FeaturePointer])[];
}
