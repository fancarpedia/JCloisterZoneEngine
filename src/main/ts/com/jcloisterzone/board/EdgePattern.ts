import { Valued } from "../../../io/vavr/equality.js";
import { Map as VMap } from "../../../io/vavr/Map.js";
import { EdgeType } from "./EdgeType.js";
import { Location } from "./Location.js";
import { Rotation } from "./Rotation.js";
import { TileSymmetry } from "./TileSymmetry.js";

/**
 * Edge pattern of a tile: the 4 edge types (N, E, S, W) packed into a bit mask
 * (4 bits per side, N in the low nibble).
 *
 * NOTE: Java's hashCode returned the raw mask while equals compares the
 * canonical (rotation-min) mask — inconsistent. Here hashCode also uses the
 * canonical mask so EdgePattern is safe as a value-equality key (behaviour
 * preserving: equal patterns now also hash equal).
 */
export class EdgePattern implements Valued {
  /** bit mask, concatenated edges N,E,S,W */
  readonly mask: number;

  constructor(mask: number);
  constructor(n: EdgeType, e: EdgeType, s: EdgeType, w: EdgeType);
  constructor(edges: VMap<Location, EdgeType>);
  constructor(a: number | EdgeType | VMap<Location, EdgeType>, e?: EdgeType, s?: EdgeType, w?: EdgeType) {
    if (typeof a === "number") {
      this.mask = a;
    } else if (a instanceof VMap) {
      const n = a.get(Location.N).get();
      this.mask =
        n.getMask() +
        (a.get(Location.E).get().getMask() << 4) +
        (a.get(Location.S).get().getMask() << 8) +
        (a.get(Location.W).get().getMask() << 12);
    } else {
      this.mask =
        a.getMask() + (e!.getMask() << 4) + (s!.getMask() << 8) + (w!.getMask() << 12);
    }
  }

  static fromString(str: string): EdgePattern {
    if (str.length !== 4) {
      throw new Error("IllegalArgument");
    }
    return new EdgePattern(
      EdgeType.forChar(str.charAt(0)),
      EdgeType.forChar(str.charAt(1)),
      EdgeType.forChar(str.charAt(2)),
      EdgeType.forChar(str.charAt(3)),
    );
  }

  /** The four edge types in order N, E, S, W. */
  getEdges(): EdgeType[] {
    return [
      EdgeType.forMask(this.mask & 0xf),
      EdgeType.forMask((this.mask >> 4) & 0xf),
      EdgeType.forMask((this.mask >> 8) & 0xf),
      EdgeType.forMask((this.mask >> 12) & 0xf),
    ];
  }

  getSymmetry(): TileSymmetry {
    const e = this.getEdges();
    if (e[0] === e[1] && e[0] === e[2] && e[0] === e[3]) return TileSymmetry.S4;
    if (e[0] === e[2] && e[1] === e[3]) return TileSymmetry.S2;
    return TileSymmetry.NONE;
  }

  at(loc: Location): EdgeType {
    if (loc === Location.N) return EdgeType.forMask(this.mask & 15);
    if (loc === Location.E) return EdgeType.forMask((this.mask >> 4) & 15);
    if (loc === Location.S) return EdgeType.forMask((this.mask >> 8) & 15);
    if (loc === Location.W) return EdgeType.forMask((this.mask >> 12) & 15);
    throw new Error("IllegalArgument");
  }

  rotate(rot: Rotation): EdgePattern {
    if (rot === Rotation.R0) return this;
    const edges = this.getEdges();
    const d = rot.ordinal();
    const rotated: EdgeType[] = new Array(4);
    for (let i = 0; i < 4; i++) {
      rotated[(i + d) % 4] = edges[i];
    }
    return new EdgePattern(rotated[0], rotated[1], rotated[2], rotated[3]);
  }

  replace(loc: Location, type: EdgeType): EdgePattern {
    return new EdgePattern(
      loc === Location.N ? type : this.at(Location.N),
      loc === Location.E ? type : this.at(Location.E),
      loc === Location.S ? type : this.at(Location.S),
      loc === Location.W ? type : this.at(Location.W),
    );
  }

  /** Number of edges with unknown (ANY) type. */
  wildcardSize(): number {
    return this.getEdges().filter((edge) => edge === EdgeType.ANY).length;
  }

  /** Rotation-independent canonical form (min mask over rotations). */
  canonize(): EdgePattern {
    let min: EdgePattern = this;
    for (const rot of Rotation.values()) {
      const ep = this.rotate(rot);
      if (ep.mask < min.mask) {
        min = ep;
      }
    }
    return min;
  }

  isMatchingExact(ep: EdgePattern): boolean {
    const m = this.mask & ep.mask;
    return (
      (m & 0xf) !== 0 &&
      (m & (0xf << 4)) !== 0 &&
      (m & (0xf << 8)) !== 0 &&
      (m & (0xf << 12)) !== 0
    );
  }

  isMatchingAnyRotation(ep: EdgePattern): boolean {
    for (const rot of Rotation.values()) {
      if (this.rotate(rot).isMatchingExact(ep)) {
        return true;
      }
    }
    return false;
  }

  isBridgeAllowed(bridge: Location): boolean {
    if (bridge === Location.NS) {
      if (this.at(Location.N) !== EdgeType.FIELD) return false;
      if (this.at(Location.S) !== EdgeType.FIELD) return false;
    } else {
      if (this.at(Location.W) !== EdgeType.FIELD) return false;
      if (this.at(Location.E) !== EdgeType.FIELD) return false;
    }
    return true;
  }

  private getBridgeReplacement(side: Location): EdgeType {
    switch (this.at(side)) {
      case EdgeType.FIELD:
        return EdgeType.ROAD;
      case EdgeType.ANY:
        return EdgeType.ANY;
      default:
        throw new Error("IllegalArgument");
    }
  }

  getBridgePattern(bridge: Location): EdgePattern {
    try {
      if (bridge === Location.NS) {
        return new EdgePattern(
          this.getBridgeReplacement(Location.N),
          this.at(Location.E),
          this.getBridgeReplacement(Location.S),
          this.at(Location.W),
        );
      }
      return new EdgePattern(
        this.at(Location.N),
        this.getBridgeReplacement(Location.E),
        this.at(Location.S),
        this.getBridgeReplacement(Location.W),
      );
    } catch (e) {
      throw new Error("Pattern cannot be extended with " + bridge + "bridge.");
    }
  }

  equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof EdgePattern)) return false;
    return obj.canonize().mask === this.canonize().mask;
  }

  hashCode(): number {
    return this.canonize().mask;
  }

  toString(): string {
    return (
      this.at(Location.N).asChar() +
      this.at(Location.E).asChar() +
      this.at(Location.S).asChar() +
      this.at(Location.W).asChar()
    );
  }
}
