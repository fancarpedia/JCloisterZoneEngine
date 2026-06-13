import { List } from "../../../io/vavr/SeqTypes.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Feature } from "./Feature.js";
import type { Structure } from "./Structure.js";
import { TileFeature } from "./TileFeature.js";
import type { TrapFeature } from "./TrapFeature.js";

/** Solovei Razboynik (Russian Promos) — a road trap that exposes followers on its road. */
export class SoloveiRazboynik extends TileFeature implements Structure, TrapFeature {
  static readonly simpleName = "SoloveiRazboynik";

  static readonly INITIAL_PLACE = List.of(
    new FeaturePointer(Position.ZERO, SoloveiRazboynik, Location.I),
  );

  constructor(places: List<FeaturePointer> = SoloveiRazboynik.INITIAL_PLACE) {
    super(places);
  }

  isTrapFeature(): true {
    return true;
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new SoloveiRazboynik(this.placeOnBoardPlaces(pos, rot));
  }
}
