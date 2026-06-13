import { HashSet, type Set } from "../../../io/vavr/Set.js";
import { List } from "../../../io/vavr/SeqTypes.js";
import { Edge } from "../board/Edge.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Feature } from "./Feature.js";
import { ScoreableTileFeature } from "./ScoreableTileFeature.js";

/** A castle (Bridges, Castles &amp; Bazaars). Spans two tiles. */
export class Castle extends ScoreableTileFeature {
  static readonly simpleName = "Castle";

  constructor(places: List<FeaturePointer>) {
    super(places);
  }

  getEdge(): Edge {
    return new Edge(this.places.get(0).getPosition(), this.places.get(1).getPosition());
  }

  override getTilePositions(): Set<Position> {
    return HashSet.ofAll(this.places.map((fp) => fp.getPosition()).toArray());
  }

  getVicinity(): Set<Position> {
    const p0 = this.places.get(0).getPosition();
    const p1 = this.places.get(1).getPosition();
    let vicinity: Set<Position> = HashSet.of(p0, p1);
    if (p0.x === p1.x) {
      vicinity = vicinity.addAll(
        List.of(p0.add(Location.W), p0.add(Location.E), p1.add(Location.W), p1.add(Location.E)),
      );
    } else {
      vicinity = vicinity.addAll(
        List.of(p0.add(Location.N), p0.add(Location.S), p1.add(Location.N), p1.add(Location.S)),
      );
    }
    return vicinity;
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    throw new Error("UnsupportedOperation");
  }
}
