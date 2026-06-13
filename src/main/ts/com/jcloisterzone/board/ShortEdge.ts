import { Edge } from "./Edge.js";
import { Location } from "./Location.js";
import { Position } from "./Position.js";
import { Rotation } from "./Rotation.js";

/** Special case of city multi-edge (the Hills &amp; Sheep weird tile). */
export class ShortEdge extends Edge {
  constructor(p1: Position, p2: Position);
  constructor(pos: Position, loc: Location);
  constructor(edge: Edge);
  constructor(a: Position | Edge, b?: Position | Location) {
    if (a instanceof Edge) {
      super(a.getP1(), a.getP2());
    } else {
      super(a as Position, b as Position);
    }
  }

  translate(pos: Position): ShortEdge {
    return new ShortEdge(super.translate(pos));
  }

  rotateCCW(origin: Position, rot: Rotation): ShortEdge {
    return new ShortEdge(super.rotateCCW(origin, rot));
  }

  rotateCW(origin: Position, rot: Rotation): ShortEdge {
    return new ShortEdge(super.rotateCW(origin, rot));
  }

  toEdge(): Edge {
    return new Edge(this.p1, this.p2);
  }

  toString(): string {
    return `ShortEdge(${this.p1}, ${this.p2})`;
  }
}
