import type { Set } from "../../../io/vavr/Set.js";
import { List } from "../../../io/vavr/SeqTypes.js";
import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { NeighbouringFeature } from "./NeighbouringFeature.js";
import { ScoreableTileFeature } from "./ScoreableTileFeature.js";

/**
 * Synthetic port-only base: Scoreable + NeighbouringFeature (Wagon-move
 * neighboring set). CompletableFeature and MonasticFeature extend this.
 */
export abstract class NeighbouringTileFeature
  extends ScoreableTileFeature
  implements NeighbouringFeature
{
  protected readonly neighboring: Set<FeaturePointer>;

  constructor(places: List<FeaturePointer>, neighboring: Set<FeaturePointer>) {
    super(places);
    this.neighboring = neighboring;
  }

  getNeighboring(): Set<FeaturePointer> {
    return this.neighboring;
  }

  abstract setNeighboring(neighboring: Set<FeaturePointer>): NeighbouringFeature;

  placeOnBoardNeighboring(pos: Position, rot: Rotation): Set<FeaturePointer> {
    return this.neighboring.map((fp) => fp.rotateCW(rot).translate(pos));
  }
}
