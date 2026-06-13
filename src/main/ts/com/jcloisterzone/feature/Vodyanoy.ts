import { List } from "../../../io/vavr/SeqTypes.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Feature } from "./Feature.js";
import { ScoreableTileFeature } from "./ScoreableTileFeature.js";
import type { TrapFeature } from "./TrapFeature.js";

/** Vodyanoy (Russian Promos) — a trap that exposes followers on adjacent tiles and, at
 *  final scoring, penalises -2 per follower sitting on it. */
export class Vodyanoy extends ScoreableTileFeature implements TrapFeature {
  static readonly simpleName = "Vodyanoy";

  static readonly INITIAL_PLACE = List.of(
    new FeaturePointer(Position.ZERO, Vodyanoy, Location.I),
  );

  constructor(places: List<FeaturePointer> = Vodyanoy.INITIAL_PLACE) {
    super(places);
  }

  isTrapFeature(): true {
    return true;
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new Vodyanoy(this.placeOnBoardPlaces(pos, rot));
  }
}
