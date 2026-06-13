import { List } from "../../../io/vavr/SeqTypes.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Feature } from "./Feature.js";
import type { Structure } from "./Structure.js";
import { TileFeature } from "./TileFeature.js";

/** A circus space (Under the Big Top) — the Big Top neutral figure visits it and the
 *  Ringmaster scores bonuses for adjacent circus/acrobats spaces. */
export class Circus extends TileFeature implements Structure {
  static readonly simpleName = "Circus";

  static readonly INITIAL_PLACE = List.of(new FeaturePointer(Position.ZERO, Circus, Location.I));

  constructor(places: List<FeaturePointer> = Circus.INITIAL_PLACE) {
    super(places);
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new Circus(this.placeOnBoardPlaces(pos, rot));
  }
}
