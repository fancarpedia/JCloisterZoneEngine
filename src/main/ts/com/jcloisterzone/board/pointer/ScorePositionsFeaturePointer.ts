import type { Set } from "../../../../io/vavr/Set.js";
import type { Position } from "../Position.js";
import type { BoardPointer } from "./BoardPointer.js";
import type { FeaturePointer } from "./FeaturePointer.js";

/** A scoring source: a feature pointer plus the set of positions it spans. */
export class ScorePositionsFeaturePointer implements BoardPointer {
  constructor(
    private readonly featurePointer: FeaturePointer,
    private readonly positions: Set<Position>,
  ) {}

  asFeaturePointer(): FeaturePointer {
    return this.featurePointer;
  }

  getPosition(): Position {
    return this.featurePointer.getPosition();
  }

  getPositions(): Set<Position> {
    return this.positions;
  }

  toString(): string {
    const fp = this.featurePointer;
    return `[x=${fp.getPosition().x},y=${fp.getPosition().y},${fp.getFeature()},${fp.getLocation()},positions=${this.positions.mkString(",")}]`;
  }
}
