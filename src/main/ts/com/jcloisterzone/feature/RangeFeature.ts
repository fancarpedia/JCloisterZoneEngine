import type { Stream } from "../../../io/vavr/SeqTypes.js";
import type { GameState } from "../game/state/GameState.js";
import type { PlacedTile } from "../game/state/PlacedTile.js";
import type { Feature } from "./Feature.js";

/** A feature with a range of tiles (cloister/garden/dragon vicinity). */
export interface RangeFeature extends Feature {
  getRangeTiles(state: GameState): Stream<PlacedTile>;
  /** default: range tiles plus the feature's own tiles. */
  getRangeTilesWithFeature(state: GameState): Stream<PlacedTile>;
}

/** Runtime mirror of Java's `instanceof RangeFeature` (duck-typed on
 *  getRangeTilesWithFeature). THE single definition. */
export function isInstanceOfRangeFeature(f: unknown): f is RangeFeature {
  return typeof (f as { getRangeTilesWithFeature?: unknown } | null)?.getRangeTilesWithFeature === "function";
}
