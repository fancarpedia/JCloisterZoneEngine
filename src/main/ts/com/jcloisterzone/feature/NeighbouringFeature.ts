import type { Set } from "../../../io/vavr/Set.js";
import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Feature } from "./Feature.js";

/** Neighbouring info for the C1 Wagon move. */
export interface NeighbouringFeature extends Feature {
  setNeighboring(neighboring: Set<FeaturePointer>): NeighbouringFeature;
  getNeighboring(): Set<FeaturePointer>;
  /** default */
  placeOnBoardNeighboring(pos: Position, rot: Rotation): Set<FeaturePointer>;
}

/** Runtime mirror of Java's `instanceof NeighbouringFeature` (duck-typed on
 *  getNeighboring). THE single definition. */
export function isInstanceOfNeighbouringFeature(f: unknown): f is NeighbouringFeature {
  return typeof (f as { getNeighboring?: unknown }).getNeighboring === "function";
}
