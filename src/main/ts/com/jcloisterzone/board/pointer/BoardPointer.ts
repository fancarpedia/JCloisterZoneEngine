import type { Position } from "../Position.js";
import type { FeaturePointer } from "./FeaturePointer.js";

/** Something that points at a place on the board (a Position, FeaturePointer, ...). */
export interface BoardPointer {
  getPosition(): Position;
  asFeaturePointer(): FeaturePointer;
}
