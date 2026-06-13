import type { Set } from "../../../io/vavr/Set.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { PointsExpression } from "../event/PointsExpression.js";
import type { GameState } from "../game/state/GameState.js";
import type { NeighbouringFeature } from "./NeighbouringFeature.js";
import type { Scoreable } from "./Scoreable.js";

/** A completable feature (city, road, cloister): scoreable + has open edges. */
export interface Completable extends Scoreable, NeighbouringFeature {
  isOpen(state: GameState): boolean;
  /** default: !isOpen. */
  isCompleted(state: GameState): boolean;
  setNeighboring(neighboring: Set<FeaturePointer>): Completable;
  getPoints(state: GameState): PointsExpression;
  /** Feature points as completed/incomplete, unaffected by Mage/Witch/little buildings. */
  getStructurePoints(state: GameState, completed: boolean): PointsExpression;
  /** Erased-interface marker — `implements Completable` forces it; the guard tests it. */
  isCompletable(): true;
}

/** Runtime mirror of Java's `instanceof Completable` (TS interfaces are erased).
 *  Duck-typed on the compiler-enforced marker method, so any class declaring
 *  `implements Completable` (or extending CompletableFeature / MonasticFeature)
 *  is picked up automatically. THE single definition: never write a local
 *  per-file class list. */
export function isInstanceOfCompletable(f: unknown): f is Completable {
  return typeof (f as { isCompletable?: unknown } | null)?.isCompletable === "function";
}
