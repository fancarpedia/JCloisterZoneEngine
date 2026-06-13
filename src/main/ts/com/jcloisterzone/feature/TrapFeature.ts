/**
 * Marker for trap features (Russian Promos: Vodyanoy, SoloveiRazboynik). Java models this
 * as an interface; here it is a duck-typed marker (the implementing features extend
 * different bases — ScoreableTileFeature / TileFeature — so a shared base class is not an
 * option). Use {@link isInstanceOfTrapFeature} instead of `instanceof`. No basic feature is a trap.
 */
export interface TrapFeature {
  isTrapFeature(): true;
}

export function isInstanceOfTrapFeature(f: unknown): f is TrapFeature {
  return typeof (f as { isTrapFeature?: unknown } | null)?.isTrapFeature === "function";
}
