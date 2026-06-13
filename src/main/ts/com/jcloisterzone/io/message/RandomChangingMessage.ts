import type { Message } from "./Message.js";

/** A message that carries/sets a random value (e.g. dice, flying machine). */
export interface RandomChangingMessage extends Message {
  getRandom(): number | null;
  setRandom(random: number | null): void;
}

/** Runtime mirror of Java's `instanceof RandomChangingMessage` (TS interfaces are
 *  erased) — duck-typed on the required `getRandom` accessor. */
export function isInstanceOfRandomChangingMessage(m: unknown): m is RandomChangingMessage {
  return typeof (m as { getRandom?: unknown } | null)?.getRandom === "function";
}
