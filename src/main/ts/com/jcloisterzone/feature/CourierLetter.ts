import { List } from "../../../io/vavr/SeqTypes.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Feature } from "./Feature.js";
import type { Structure } from "./Structure.js";
import { TileFeature } from "./TileFeature.js";

/** The Courier's letter space (The Courier) — the courier figure is summoned onto it; a meeple
 *  may not be deployed here. */
export class CourierLetter extends TileFeature implements Structure {
  static readonly simpleName = "CourierLetter";

  static readonly INITIAL_PLACE = List.of(new FeaturePointer(Position.ZERO, CourierLetter, Location.I));

  constructor(places: List<FeaturePointer> = CourierLetter.INITIAL_PLACE) {
    super(places);
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new CourierLetter(this.placeOnBoardPlaces(pos, rot));
  }
}
