import { Valued, hashString } from "../../../io/vavr/equality.js";
import { List, Vector } from "../../../io/vavr/SeqTypes.js";
import { Corner } from "./Corner.js";
import { Rotation } from "./Rotation.js";

/**
 * Represents locations on a tile (any "space" where features can sit). Locations
 * are bit flags so multiple can coexist on a tile.
 *
 *   Bit order            Field locations              Roads/rivers/cities (<<8)
 *   +---------+          +------------+               +-----------------+
 *   |  0   1  |          |    1    2  |               |       768       |
 *   |7       2|          |128        4|               |49152        3072|
 *   |6       3|          | 64        8|               |                 |
 *   |  5   4  |          |   32   16  |               |      12288      |
 *   +---------+          +------------+               +-----------------+
 *
 * City/road/river locations are shifted by 8 bits so they coexist with fields.
 *
 * Java used reflection to resolve named constants; here a static name registry
 * is used instead. Masked instances are interned by mask (so identity holds).
 */
export class Location implements Valued {
  private static readonly nameRegistry = new Map<string, Location>();
  private static readonly edgeInstances = new Map<number, Location>();

  private readonly name: string | null;
  private readonly mask: number | null;

  private constructor(name: string | null, mask: number | null) {
    this.name = name;
    this.mask = mask;
    if (mask !== null) {
      Location.edgeInstances.set(mask, this);
    }
    if (name !== null) {
      Location.nameRegistry.set(name, this);
    }
  }

  /**
   * Returns the instance for the given mask (interned), or resolves a named
   * instance when mask is null.
   */
  static create(name: string | null, mask: number | null): Location {
    if (mask !== null && mask === 0) {
      throw new Error("Empty mask is not allowed");
    }
    if (mask === null) {
      const loc = Location.nameRegistry.get(name as string);
      if (!loc) throw new Error("Unknown location " + name);
      return loc;
    }
    const existing = Location.edgeInstances.get(mask);
    if (existing) return existing;
    return new Location(name, mask);
  }

  // edge locations for fields
  /** North left field */
  static readonly NL = new Location("NL", 0b00000001);
  /** North right field */
  static readonly NR = new Location("NR", 0b00000010);
  /** East left field */
  static readonly EL = new Location("EL", 0b00000100);
  /** East right field */
  static readonly ER = new Location("ER", 0b00001000);
  /** South left field */
  static readonly SL = new Location("SL", 0b00010000);
  /** South right field */
  static readonly SR = new Location("SR", 0b00100000);
  /** West left field */
  static readonly WL = new Location("WL", 0b01000000);
  /** West right field */
  static readonly WR = new Location("WR", 0b10000000);

  // edge locations for other features
  /** North */
  static readonly N = new Location("N", 0b00000011 << 8);
  /** West */
  static readonly W = new Location("W", 0b11000000 << 8);
  /** South */
  static readonly S = new Location("S", 0b00110000 << 8);
  /** East */
  static readonly E = new Location("E", 0b00001100 << 8);

  /** North-west */
  static readonly NW = new Location("NW", 0b11000011 << 8);
  /** South-west */
  static readonly SW = new Location("SW", 0b11110000 << 8);
  /** South-east */
  static readonly SE = new Location("SE", 0b00111100 << 8);
  /** North-east */
  static readonly NE = new Location("NE", 0b00001111 << 8);

  /** Horizontal location - W + E */
  static readonly WE = new Location("WE", 0b11001100 << 8);
  /** Vertical location - N + S */
  static readonly NS = new Location("NS", 0b00110011 << 8);
  /** All edge locations */
  static readonly NWSE = new Location("NWSE", 0b11111111 << 8);

  /** Cardinal direction north (as opposed to a feature-space facing north). */
  static readonly _N = new Location("_N", 0b11111100 << 8);
  /** Cardinal direction west. */
  static readonly _W = new Location("_W", 0b00111111 << 8);
  /** Cardinal direction south. */
  static readonly _S = new Location("_S", 0b11001111 << 8);
  /** Cardinal direction east. */
  static readonly _E = new Location("_E", 0b11110011 << 8);

  // inner locations
  static readonly I = new Location("I", null);
  static readonly II = new Location("II", null);
  static readonly III = new Location("III", null);
  static readonly IV = new Location("IV", null);

  /** An abbot space (monasteries from German/Belgium monasteries). */
  static readonly AS_ABBOT = new Location("AS_ABBOT", null);

  // City of Carcassonne specials (Count)
  static readonly QUARTER_CASTLE = new Location("QUARTER_CASTLE", null);
  static readonly QUARTER_MARKET = new Location("QUARTER_MARKET", null);
  static readonly QUARTER_BLACKSMITH = new Location("QUARTER_BLACKSMITH", null);
  static readonly QUARTER_CATHEDRAL = new Location("QUARTER_CATHEDRAL", null);

  static readonly SIDES = List.of(Location.N, Location.E, Location.S, Location.W);
  static readonly FIELD_SIDES = List.of(
    Location.NL,
    Location.NR,
    Location.EL,
    Location.ER,
    Location.SL,
    Location.SR,
    Location.WL,
    Location.WR,
  );
  static readonly BRIDGES = List.of(Location.NS, Location.WE);
  static readonly QUARTERS = List.of(
    Location.QUARTER_CASTLE,
    Location.QUARTER_MARKET,
    Location.QUARTER_BLACKSMITH,
    Location.QUARTER_CATHEDRAL,
  );

  equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof Location)) return false;
    const other = obj as Location;
    if (this.mask !== null) {
      return other.mask !== null && this.mask === other.mask;
    }
    return this.name === other.name;
  }

  hashCode(): number {
    return this.mask === null ? hashString(this.name as string) : this.mask;
  }

  /** Same mask but rotated 90 degrees clockwise. */
  next(): Location {
    return this.shift(2);
  }

  /** Same mask but rotated 90 degrees counter-clockwise. */
  prev(): Location {
    return this.shift(6);
  }

  /** Mirror of this. */
  rev(): Location {
    if (this.mask === null) {
      throw new Error("Not available for inner locations");
    }
    const mask = this.mask;
    // odd bits shift by 5, even by 3
    let mLo = mask & 0xff;
    mLo = ((mLo & 0b01010101) << 5) | ((mLo & 0b10101010) << 3);
    mLo = (mLo | (mLo >> 8)) & 0xff;

    let mHi = (mask & 0xff00) >> 8;
    mHi = ((mHi & 0b01010101) << 5) | ((mHi & 0b10101010) << 3);
    mHi = (mHi | (mHi >> 8)) & 0xff;

    return Location.create(null, (mask & ~0xffff) | (mHi << 8) | mLo);
  }

  /** Clockwise bitwise mask rotation by i bits. */
  private shift(i: number): Location {
    if (this.mask === null) {
      throw new Error("Not available for inner locations");
    }
    const mask = this.mask;
    let mLo = (mask & 0x00ff) << i;
    mLo = (mLo | (mLo >> 8)) & 0x00ff;

    let mHi = (mask & 0xff00) << i;
    mHi = (mHi | (mHi >> 8)) & 0xff00;

    return Location.create(null, (mask & ~0xffff) | mHi | mLo);
  }

  /** Same mask but rotated rot counter-clockwise. */
  rotateCCW(rot: Rotation): Location {
    if (this.mask === null) return this;
    return this.shift((rot.ordinal() * 6) % 8);
  }

  /** Same mask but rotated rot clockwise. */
  rotateCW(rot: Rotation): Location {
    if (this.mask === null) return this;
    return this.shift(rot.ordinal() * 2);
  }

  getLeftField(): Location {
    if (!this.isEdge()) throw new Error("Edge expected");
    return Location.create(null, (this.mask! >> 8) & 0b01010101);
  }

  getRightField(): Location {
    if (!this.isEdge()) throw new Error("Edge expected");
    return Location.create(null, (this.mask! >> 8) & 0b010101010);
  }

  fieldToSide(): Location {
    if (!this.isFieldEdge()) throw new Error("Field edge expected");
    let mask = 0;
    if (Location.NL.isPartOf(this)) mask |= Location.N.mask!;
    if (Location.NR.isPartOf(this)) mask |= Location.N.mask!;
    if (Location.EL.isPartOf(this)) mask |= Location.E.mask!;
    if (Location.ER.isPartOf(this)) mask |= Location.E.mask!;
    if (Location.SL.isPartOf(this)) mask |= Location.S.mask!;
    if (Location.SR.isPartOf(this)) mask |= Location.S.mask!;
    if (Location.WL.isPartOf(this)) mask |= Location.W.mask!;
    if (Location.WR.isPartOf(this)) mask |= Location.W.mask!;
    return Location.create(null, mask);
  }

  /** Whether this is part of loc. */
  isPartOf(loc: Location): boolean {
    if (this.mask === null || loc.mask === null) return this === loc;
    return ((this.mask ^ loc.mask) & this.mask) === 0;
  }

  toString(): string {
    if (this.name !== null) return this.name;
    const parts: string[] = [];
    for (const atom of Location.FIELD_SIDES) {
      if (this.hasIntersection(atom)) {
        parts.push(atom.name as string);
      }
    }
    return parts.join(".");
  }

  /** Merge two locations (bitwise OR of masks). */
  union(loc: Location | null): Location {
    if (loc === null) return this;
    if (this.isInner()) throw new Error("Not allowed for inner location");
    if (
      loc.isInner() ||
      (this.isEdge() && !loc.isEdge()) ||
      (this.isFieldEdge() && !loc.isFieldEdge())
    ) {
      throw new Error("Same edge type is required");
    }
    return Location.create(null, this.mask! | loc.mask!);
  }

  /** Bits in this not in loc. */
  subtract(loc: Location | null): Location {
    if (loc === null) return this;
    if (this.isInner()) throw new Error("Not allowed for inner location");
    if (
      loc.isInner() ||
      (this.isEdge() && !loc.isEdge()) ||
      (this.isFieldEdge() && !loc.isFieldEdge())
    ) {
      throw new Error("Same edge type is required");
    }
    return Location.create(null, ~(this.mask! & loc.mask!) & this.mask!);
  }

  /** Bitwise AND of masks, or null when incompatible/empty. */
  intersect(loc: Location | null): Location | null {
    if (loc === null || this.isInner() || loc.isInner()) return null;
    if ((this.isEdge() && !loc.isEdge()) || (this.isFieldEdge() && !loc.isFieldEdge())) {
      return null;
    }
    if ((this.mask! & loc.mask!) === 0) return null;
    return Location.create(null, this.mask! & loc.mask!);
  }

  private hasIntersection(loc: Location): boolean {
    return this.mask !== null && loc.mask !== null && (this.mask & loc.mask) > 0;
  }

  /** Split into side components. */
  splitToSides(): List<Location> {
    return Location.SIDES.filter((side) => this.hasIntersection(side)) as List<Location>;
  }

  splitToFieldSides(): List<Location> {
    return Location.FIELD_SIDES.filter((side) => this.hasIntersection(side)) as List<Location>;
  }

  /**
   * Creates an instance from a name; '.'-separated parts are merged (unioned).
   * e.g. "N.AS_ABBOT".
   */
  static valueOf(name: string): Location {
    let value: Location | null = null;
    for (const part of name.split(".")) {
      const item = Location.nameRegistry.get(part);
      if (!item) throw new Error("Unknown location " + name);
      value = item.union(value);
    }
    if (value === null) throw new Error("Unknown location " + name);
    return value;
  }

  /** Rotation that makes loc match this, or null. */
  getRotationOf(loc: Location): Rotation | null {
    for (const r of Rotation.values()) {
      if (this.equals(loc.rotateCW(r))) return r;
    }
    return null;
  }

  isRotationOf(loc: Location): boolean {
    return this.getRotationOf(loc) !== null;
  }

  /** Included full field corners. */
  getCorners(): Vector<Corner> {
    if (!this.isFieldEdge()) {
      return Vector.empty<Corner>();
    }
    let res: Vector<Corner> = Vector.empty<Corner>();
    if (Location.WR.isPartOf(this) && Location.NL.isPartOf(this)) res = res.append(Corner.NW) as Vector<Corner>;
    if (Location.NR.isPartOf(this) && Location.EL.isPartOf(this)) res = res.append(Corner.NE) as Vector<Corner>;
    if (Location.ER.isPartOf(this) && Location.SL.isPartOf(this)) res = res.append(Corner.SE) as Vector<Corner>;
    if (Location.SR.isPartOf(this) && Location.WL.isPartOf(this)) res = res.append(Corner.SW) as Vector<Corner>;
    return res;
  }

  isInner(): boolean {
    return this.mask === null;
  }

  isFieldEdge(): boolean {
    return this.mask !== null && (this.mask & 0xff) > 0;
  }

  isEdge(): boolean {
    return this.mask !== null && (this.mask & 0xff00) > 0;
  }

  isSpecialLocation(): boolean {
    return this.mask !== null && (this.mask & ~0x3ffff) > 0;
  }

  isBridgeLocation(): boolean {
    return Location.BRIDGES.contains(this);
  }

  isCityOfCarcassonneQuarter(): boolean {
    return Location.QUARTERS.contains(this);
  }
}
