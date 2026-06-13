import type { List, Set } from "../../../io/vavr/index.js";
import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";

/** Anything that can sit on the board (city, road, field, cloister, ...). */
export interface Feature {
  getPlaces(): List<FeaturePointer>;
  placeOnBoard(pos: Position, rot: Rotation): Feature;
  /** default: positions covered by this feature's places. */
  getTilePositions(): Set<Position>;
}
