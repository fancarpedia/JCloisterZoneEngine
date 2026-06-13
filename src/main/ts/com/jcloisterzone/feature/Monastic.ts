import type { Position } from "../board/Position.js";
import type { Completable } from "./Completable.js";
import type { RangeFeature } from "./RangeFeature.js";
import type { Scoreable } from "./Scoreable.js";

/** Any feature completed when surrounded by eight land tiles (cloister, garden, shrine). */
export interface Monastic extends Completable, RangeFeature, Scoreable {
  getPosition(): Position;
  /** Erased-interface marker — `implements Monastic` forces it; the guard tests it. */
  isMonastic(): true;
}

/** Runtime mirror of Java's `instanceof Monastic`, duck-typed on the
 *  compiler-enforced marker method. THE single definition; never write a local
 *  per-file class list. */
export function isInstanceOfMonastic(f: unknown): f is Monastic {
  return typeof (f as { isMonastic?: unknown } | null)?.isMonastic === "function";
}
