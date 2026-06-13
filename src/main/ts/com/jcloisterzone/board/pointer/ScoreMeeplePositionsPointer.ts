import type { Set } from "../../../../io/vavr/Set.js";
import type { Location } from "../Location.js";
import type { Position } from "../Position.js";
import type { BoardPointer } from "./BoardPointer.js";
import type { FeaturePointer } from "./FeaturePointer.js";

/** A scoring source pointing at a placed meeple plus the set of positions it scored
 *  over (used by the obelisk's range scoring). */
export class ScoreMeeplePositionsPointer implements BoardPointer {
  constructor(
    private readonly featurePointer: FeaturePointer,
    private readonly meepleId: string,
    private readonly positions: Set<Position>,
  ) {}

  asFeaturePointer(): FeaturePointer {
    return this.featurePointer;
  }

  getPosition(): Position {
    return this.featurePointer.getPosition();
  }

  getLocation(): Location | null {
    return this.featurePointer.getLocation();
  }

  getMeepleId(): string {
    return this.meepleId;
  }

  getPositions(): Set<Position> {
    return this.positions;
  }

  toString(): string {
    const p = this.getPosition();
    return `[x=${p.x},y=${p.y},${this.getLocation()},${this.meepleId},positions=${this.positions.mkString(",")}]`;
  }
}
