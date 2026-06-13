import { List } from "../../../io/vavr/SeqTypes.js";
import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Feature } from "./Feature.js";
import { TileFeature } from "./TileFeature.js";

/** A City of Carcassonne quarter (castle/market/blacksmith/cathedral). */
export class Quarter extends TileFeature {
  static readonly simpleName = "Quarter";

  constructor(place: FeaturePointer | List<FeaturePointer>) {
    super(place instanceof FeaturePointer ? List.of(place) : place);
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new Quarter(this.placeOnBoardPlaces(pos, rot));
  }
}
