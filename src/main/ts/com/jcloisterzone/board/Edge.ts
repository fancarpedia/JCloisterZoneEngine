import { Valued, combineHash, equals, hashCode } from "../../../io/vavr/equality.js";
import { Location } from "./Location.js";
import { Position } from "./Position.js";
import { Rotation } from "./Rotation.js";

/** An edge between two adjacent board positions. */
export class Edge implements Valued {
  protected readonly p1: Position;
  protected readonly p2: Position;

  constructor(p1: Position, p2: Position);
  constructor(pos: Position, loc: Location);
  constructor(a: Position, b: Position | Location) {
    const p1 = a;
    const p2 = b instanceof Position ? b : a.add(b);
    // canonical ordering so the two endpoints are order-independent
    if (p1.compareTo(p2) > 0) {
      this.p1 = p2;
      this.p2 = p1;
    } else {
      this.p1 = p1;
      this.p2 = p2;
    }
  }

  translate(pos: Position): Edge {
    return new Edge(this.p1.add(pos), this.p2.add(pos));
  }

  rotateCW(origin: Position, rot: Rotation): Edge {
    return new Edge(this.p1.rotateCW(origin, rot), this.p2.rotateCW(origin, rot));
  }

  rotateCCW(origin: Position, rot: Rotation): Edge {
    return new Edge(this.p1.rotateCCW(origin, rot), this.p2.rotateCCW(origin, rot));
  }

  /** Horizontal edge (perpendicular to the relative position of the two tiles). */
  isHorizontal(): boolean {
    return this.p1.x === this.p2.x;
  }

  isVertical(): boolean {
    return this.p1.y === this.p2.y;
  }

  getP1(): Position {
    return this.p1;
  }

  getP2(): Position {
    return this.p2;
  }

  hashCode(): number {
    return combineHash(hashCode(this.p1), hashCode(this.p2));
  }

  equals(obj: unknown): boolean {
    if (obj === this) return true;
    if (obj === null || obj === undefined) return false;
    // exact-class comparison: a ShortEdge must not equal an Edge
    if ((obj as object).constructor !== this.constructor) return false;
    const e = obj as Edge;
    return equals(this.p1, e.p1) && equals(this.p2, e.p2);
  }

  toString(): string {
    return `Edge(${this.p1}, ${this.p2})`;
  }
}
