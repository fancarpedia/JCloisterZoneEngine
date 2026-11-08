import type { BoardPointer } from "./BoardPointer.js";
import type { FeaturePointer } from "./FeaturePointer.js";
import type { Position } from "../Position.js";

/**
 * A scoring source that also names the feature the points were taken FROM.
 *
 * A castle scores the value of the best completed feature in its vicinity, so the points alone
 * say nothing about where they came from: the player sees "9" on a castle with no way to tell
 * which road or city earned it. This carries both, and the client highlights the pair.
 *
 * One pointer into the source is enough - the client resolves the whole feature, with all of its
 * places, from any one of them.
 */
export class ScoreSourceFeaturePointer implements BoardPointer {
  constructor(
    private readonly featurePointer: FeaturePointer,
    private readonly source: FeaturePointer,
  ) {}

  asFeaturePointer(): FeaturePointer {
    return this.featurePointer;
  }

  getPosition(): Position {
    return this.featurePointer.getPosition();
  }

  /** The feature whose points were taken. */
  getSource(): FeaturePointer {
    return this.source;
  }

  toString(): string {
    return `[${this.featurePointer},source=${this.source}]`;
  }
}
