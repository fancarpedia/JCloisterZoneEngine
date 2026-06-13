import type { Feature } from "../../../feature/Feature.js";

/**
 * Trait: feature a wagon may move to. Mirrors Java {@code instanceof WagonEligible}.
 * TS interfaces are erased, so the interface requires a marker method — `implements
 * WagonEligible` then FORCES the class to provide it, and the guard duck-types on it.
 * New features only declare the trait on the class (like Java); no central list.
 */
export interface WagonEligible extends Feature {
  isWagonEligible(): true;
}

export function isInstanceOfWagonEligible(f: unknown): f is WagonEligible {
  return typeof (f as { isWagonEligible?: unknown } | null)?.isWagonEligible === "function";
}
