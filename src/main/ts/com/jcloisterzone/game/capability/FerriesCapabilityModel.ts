import { HashMap, HashSet, type Map as VMap, type Set } from "../../../../io/vavr/index.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import type { Location } from "../../board/Location.js";
import type { Position } from "../../board/Position.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";

/** Model of the Ferries capability: placed ferries + ferries moved this turn. */
export class FerriesCapabilityModel {
  private readonly ferries: Set<FeaturePointer>;
  private readonly movedFerries: VMap<Position, Tuple2<Location, Location>>;

  constructor(
    ferries: Set<FeaturePointer> = HashSet.empty<FeaturePointer>(),
    movedFerries: VMap<Position, Tuple2<Location, Location>> = HashMap.empty<
      Position,
      Tuple2<Location, Location>
    >(),
  ) {
    this.ferries = ferries;
    this.movedFerries = movedFerries;
  }

  getFerries(): Set<FeaturePointer> {
    return this.ferries;
  }

  getMovedFerries(): VMap<Position, Tuple2<Location, Location>> {
    return this.movedFerries;
  }

  addFerry(ferry: FeaturePointer): FerriesCapabilityModel {
    return new FerriesCapabilityModel(this.ferries.add(ferry), this.movedFerries);
  }

  setMovedFerries(movedFerries: VMap<Position, Tuple2<Location, Location>>): FerriesCapabilityModel {
    if (this.movedFerries === movedFerries) return this;
    return new FerriesCapabilityModel(this.ferries, movedFerries);
  }

  mapMovedFerries(
    fn: (m: VMap<Position, Tuple2<Location, Location>>) => VMap<Position, Tuple2<Location, Location>>,
  ): FerriesCapabilityModel {
    return this.setMovedFerries(fn(this.movedFerries));
  }
}
