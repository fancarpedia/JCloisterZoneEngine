import type { List } from "../../../io/vavr/SeqTypes.js";
import type { Edge } from "../board/Edge.js";
import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { EdgeFeature } from "./EdgeFeature.js";
import type { Feature } from "./Feature.js";
import { TileFeature } from "./TileFeature.js";

/** A city gate edge feature (acts as a city-side proxy for bridges). */
export class CityGate extends TileFeature implements EdgeFeature {
  static readonly simpleName = "CityGate";

  private readonly adjoiningCity: FeaturePointer;

  constructor(places: List<FeaturePointer>, adjoiningCity: FeaturePointer) {
    super(places);
    this.adjoiningCity = adjoiningCity;
  }

  override isStructure(): boolean {
    return false;
  }

  override isMergeableWith(other: EdgeFeature): boolean {
    return false;
  }

  closeEdge(edge: Edge): CityGate {
    return this;
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new CityGate(this.placeOnBoardPlaces(pos, rot), this.adjoiningCity.rotateCW(rot).translate(pos));
  }

  override getProxyTarget(): FeaturePointer {
    return this.adjoiningCity;
  }
}
