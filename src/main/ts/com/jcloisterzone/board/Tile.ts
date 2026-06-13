import { type Map as VMap } from "../../../io/vavr/Map.js";
import type { Set } from "../../../io/vavr/Set.js";
import { Tuple2 } from "../../../io/vavr/Tuple.js";
import { AbbeyEdge } from "../feature/AbbeyEdge.js";
import { Bridge } from "../feature/Bridge.js";
import { Bush } from "../feature/Bush.js";
import { City } from "../feature/City.js";
import { CityGate } from "../feature/CityGate.js";
import type { Feature } from "../feature/Feature.js";
import { River } from "../feature/River.js";
import { Road } from "../feature/Road.js";
import { EdgePattern } from "./EdgePattern.js";
import { EdgeType } from "./EdgeType.js";
import { Location } from "./Location.js";
import { Position } from "./Position.js";
import { FeaturePointer } from "./pointer/FeaturePointer.js";
import type { TileModifier } from "./TileModifier.js";
import type { TileSymmetry } from "./TileSymmetry.js";

/** A tile type (its features, edge pattern, symmetry and modifiers). */
export class Tile {
  private readonly id: string;
  private readonly edgePattern: EdgePattern;
  private readonly symmetry: TileSymmetry;
  /** feature pointers use Position.ZERO for unplaced tiles. */
  private readonly initialFeatures: VMap<FeaturePointer, Feature>;
  private readonly modifiers: Set<TileModifier>;

  constructor(id: string, initialFeatures: VMap<FeaturePointer, Feature>, modifiers: Set<TileModifier>) {
    this.id = id;
    this.initialFeatures = initialFeatures;
    this.modifiers = modifiers;
    this.edgePattern = this.computeEdgePattern();
    this.symmetry = this.edgePattern.getSymmetry();
  }

  addTileModifier(modifier: TileModifier): Tile {
    return new Tile(this.id, this.initialFeatures, this.modifiers.add(modifier));
  }

  setInitialFeatures(initialFeatures: VMap<FeaturePointer, Feature>): Tile {
    return new Tile(this.id, initialFeatures, this.modifiers);
  }

  addBridge(bridgeLoc: Location): Tile {
    const bridge = new Bridge(bridgeLoc);
    return this.setInitialFeatures(
      this.initialFeatures.put(new FeaturePointer(null as unknown as Position, Road, bridgeLoc), bridge),
    );
  }

  getId(): string {
    return this.id;
  }

  getEdgePattern(): EdgePattern {
    return this.edgePattern;
  }

  getSymmetry(): TileSymmetry {
    return this.symmetry;
  }

  getInitialFeatures(): VMap<FeaturePointer, Feature> {
    return this.initialFeatures;
  }

  getTileModifiers(): Set<TileModifier> {
    return this.modifiers;
  }

  hasModifier(modifier: TileModifier): boolean {
    return this.modifiers.contains(modifier);
  }

  private computeSideEdge(loc: Location): EdgeType {
    // Bush and CityGate are SEPARATE features but share the CITY_GATE edge TYPE
    // (mask road|field — both roads and fields may attach), mirroring Java Tile.
    const tuple: Tuple2<FeaturePointer, Feature> | null = this.initialFeatures
      .find((item) => loc.isPartOf(item._1.getLocation()!))
      .getOrNull();
    if (tuple === null) return EdgeType.FIELD;
    const f = tuple._2;
    if (f instanceof Road) return EdgeType.ROAD;
    if (f instanceof City) return EdgeType.CITY;
    if (f instanceof River) return EdgeType.RIVER;
    if (f instanceof CityGate || f instanceof Bush) return EdgeType.CITY_GATE;
    if (f instanceof AbbeyEdge) return EdgeType.ANY;
    throw new Error("IllegalArgument");
  }

  private computeEdgePattern(): EdgePattern {
    return new EdgePattern(
      this.computeSideEdge(Location.N),
      this.computeSideEdge(Location.E),
      this.computeSideEdge(Location.S),
      this.computeSideEdge(Location.W),
    );
  }

  toString(): string {
    return this.id;
  }
}
