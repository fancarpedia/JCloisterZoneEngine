import type { FeaturePointer } from "../../../board/pointer/FeaturePointer.js";
import type { GameState } from "../../state/GameState.js";

/** A capability that can veto the completion of a feature (Donkey, …).
 *  Mirrors Java {@code trait/FeatureCompletionBlocker}. */
export interface FeatureCompletionBlocker {
  isFeatureCompletionBlocked(state: GameState, fp: FeaturePointer): boolean;
}

/** Runtime mirror of Java's `instanceof FeatureCompletionBlocker` (duck-typed on
 *  the trait's single method). THE single definition. */
export function isInstanceOfFeatureCompletionBlocker(c: unknown): c is FeatureCompletionBlocker {
  return typeof (c as { isFeatureCompletionBlocked?: unknown }).isFeatureCompletionBlocked === "function";
}
