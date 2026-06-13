import type { List } from "../../../io/vavr/SeqTypes.js";
import type { Edge } from "../board/Edge.js";
import { Location } from "../board/Location.js";
import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { EdgeFeature } from "./EdgeFeature.js";
import type { Feature } from "./Feature.js";
import { Monastery } from "./Monastery.js";
import { TileFeature } from "./TileFeature.js";

/** The abbey-tile edge feature (proxies to the abbey's monastery). */
export class AbbeyEdge extends TileFeature implements EdgeFeature {
  static readonly simpleName = "AbbeyEdge";

  constructor(places: List<FeaturePointer>) {
    super(places);
  }

  override isStructure(): boolean {
    return false;
  }

  override isMergeableWith(other: EdgeFeature): boolean {
    return false;
  }

  closeEdge(edge: Edge): AbbeyEdge {
    return this;
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new AbbeyEdge(this.placeOnBoardPlaces(pos, rot));
  }

  override getProxyTarget(): FeaturePointer {
    return new FeaturePointer(this.places.head().getPosition(), Monastery, Location.I);
  }
}
