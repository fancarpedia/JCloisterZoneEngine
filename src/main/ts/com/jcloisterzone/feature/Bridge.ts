import { HashMap } from "../../../io/vavr/Map.js";
import { type Set } from "../../../io/vavr/Set.js";
import { List, Stream } from "../../../io/vavr/SeqTypes.js";
import type { Edge } from "../board/Edge.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import { TileBuilder } from "../board/TileBuilder.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { Road } from "./Road.js";

/**
 * A bridge — used only as an initial feature; once placed it's converted to a
 * plain {@link Road}.
 */
export class Bridge extends Road {
  static readonly simpleName: string = "Bridge";

  constructor(places: List<FeaturePointer>, openEdges: Set<Edge>);
  constructor(bridgeLoc: Location);
  constructor(a: List<FeaturePointer> | Location, openEdges?: Set<Edge>) {
    if (a instanceof Location) {
      super(
        List.of(new FeaturePointer(Position.ZERO, Road, a)),
        TileBuilder.initOpenEdges(Stream.ofAll(a.splitToSides())),
        HashMap.empty(),
      );
    } else {
      super(a, openEdges!, HashMap.empty());
    }
  }
}
