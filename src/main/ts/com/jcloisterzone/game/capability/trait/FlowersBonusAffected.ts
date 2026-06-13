/**
 * Trait: feature affected by the flowers bonus (City, Road, River, Monastic).
 * Mirrors Java {@code instanceof FlowersBonusAffected} via a compiler-enforced
 * marker method (consumer arrives with the Flowers capability port).
 */
export interface FlowersBonusAffected {
  isFlowersBonusAffected(): true;
}

export function isInstanceOfFlowersBonusAffected(f: unknown): f is FlowersBonusAffected {
  return typeof (f as { isFlowersBonusAffected?: unknown } | null)?.isFlowersBonusAffected === "function";
}
