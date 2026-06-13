import { Valued } from "../../../io/vavr/equality.js";
import { LinkedHashMap, Map as VMap } from "../../../io/vavr/Map.js";
import { Location } from "./Location.js";
import { Rotation } from "./Rotation.js";
import type { BoardPointer } from "./pointer/BoardPointer.js";
import { FeaturePointer } from "./pointer/FeaturePointer.js";

/** Immutable board position. */
export class Position implements BoardPointer, Valued {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  static readonly ZERO = new Position(0, 0);

  static readonly ADJACENT: LinkedHashMap<Location, Position> = LinkedHashMap.of(
    Location.N,
    new Position(0, -1),
    Location.E,
    new Position(1, 0),
    Location.S,
    new Position(0, 1),
    Location.W,
    new Position(-1, 0),
  );

  static readonly DIAGONAL: LinkedHashMap<Location, Position> = LinkedHashMap.of(
    Location.NE,
    new Position(1, -1),
    Location.SE,
    new Position(1, 1),
    Location.SW,
    new Position(-1, 1),
    Location.NW,
    new Position(-1, -1),
  );

  static readonly ADJACENT_AND_DIAGONAL: VMap<Location, Position> =
    Position.ADJACENT.merge(Position.DIAGONAL);

  getPosition(): Position {
    return this;
  }

  asFeaturePointer(): FeaturePointer {
    return new FeaturePointer(this, null, null);
  }

  toString(): string {
    return `[${this.x},${this.y}]`;
  }

  add(p: Position): Position;
  add(loc: Location): Position;
  add(arg: Position | Location): Position {
    if (arg instanceof Position) {
      return new Position(this.x + arg.x, this.y + arg.y);
    }
    let x = this.x;
    let y = this.y;
    if (Location.N.isPartOf(arg)) y--;
    if (Location.S.isPartOf(arg)) y++;
    if (Location.W.isPartOf(arg)) x--;
    if (Location.E.isPartOf(arg)) x++;
    return new Position(x, y);
  }

  subtract(p: Position): Position {
    return new Position(this.x - p.x, this.y - p.y);
  }

  rotateCW(rot: Rotation): Position;
  rotateCW(origin: Position, rot: Rotation): Position;
  rotateCW(a: Rotation | Position, b?: Rotation): Position {
    if (a instanceof Position) {
      return this.subtract(a).rotateCW(b as Rotation).add(a);
    }
    switch (a) {
      case Rotation.R0:
        return this;
      case Rotation.R90:
        return new Position(-this.y, this.x);
      case Rotation.R180:
        return new Position(-this.x, -this.y);
      case Rotation.R270:
        return new Position(this.y, -this.x);
    }
    throw new Error("IllegalArgument");
  }

  rotateCCW(rot: Rotation): Position;
  rotateCCW(origin: Position, rot: Rotation): Position;
  rotateCCW(a: Rotation | Position, b?: Rotation): Position {
    if (a instanceof Position) {
      return this.subtract(a).rotateCCW(b as Rotation).add(a);
    }
    return this.rotateCW(a.inverse());
  }

  locationDiff(pos: Position): Location | null {
    const { x, y } = this;
    if (x === pos.x && y - 1 === pos.y) return Location.N;
    if (x === pos.x && y + 1 === pos.y) return Location.S;
    if (x + 1 === pos.x && y === pos.y) return Location.E;
    if (x - 1 === pos.x && y === pos.y) return Location.W;
    return null;
  }

  /** Orthogonal (Manhattan) distance. */
  squareDistance(p: Position): number {
    return Math.abs(this.x - p.x) + Math.abs(this.y - p.y);
  }

  diagonalDistance(p: Position): number {
    const dx = Math.abs(this.x - p.x);
    const dy = Math.abs(this.y - p.y);
    return dx === dy ? dx : 0;
  }

  hashCode(): number {
    return ((this.x << 16) ^ this.y) | 0;
  }

  equals(obj: unknown): boolean {
    if (obj instanceof Position) {
      return this.x === obj.x && this.y === obj.y;
    }
    return false;
  }

  compareTo(o: Position): number {
    if (this.y === o.y) {
      return this.x - o.x;
    }
    return this.y - o.y;
  }
}
