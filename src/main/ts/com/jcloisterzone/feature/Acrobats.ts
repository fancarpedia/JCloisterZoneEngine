import { List } from "../../../io/vavr/SeqTypes.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Feature } from "./Feature.js";
import type { Structure } from "./Structure.js";
import { TileFeature } from "./TileFeature.js";

/** An acrobats space (Under the Big Top). */
export class Acrobats extends TileFeature implements Structure {
  static readonly simpleName = "Acrobats";

  static readonly INITIAL_PLACE = List.of(new FeaturePointer(Position.ZERO, Acrobats, Location.I));

  constructor(places: List<FeaturePointer> = Acrobats.INITIAL_PLACE) {
    super(places);
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new Acrobats(this.placeOnBoardPlaces(pos, rot));
  }
}
