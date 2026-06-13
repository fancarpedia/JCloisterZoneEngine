import type { List } from "../../../io/vavr/SeqTypes.js";
import type { Edge } from "../board/Edge.js";
import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { EdgeFeature } from "./EdgeFeature.js";
import type { Feature } from "./Feature.js";
import { TileFeature } from "./TileFeature.js";

/** A bush edge feature (road-side proxy for bridges). */
export class Bush extends TileFeature implements EdgeFeature {
  static readonly simpleName = "Bush";

  private readonly adjoiningRoad: FeaturePointer;

  constructor(places: List<FeaturePointer>, adjoiningRoad: FeaturePointer) {
    super(places);
    this.adjoiningRoad = adjoiningRoad;
  }

  override isStructure(): boolean {
    return false;
  }

  override isMergeableWith(other: EdgeFeature): boolean {
    return false;
  }

  closeEdge(edge: Edge): Bush {
    return this;
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new Bush(this.placeOnBoardPlaces(pos, rot), this.adjoiningRoad.rotateCW(rot).translate(pos));
  }

  override getProxyTarget(): FeaturePointer {
    return this.adjoiningRoad;
  }
}
