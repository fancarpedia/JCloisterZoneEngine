import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Follower } from "../figure/Follower.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A follower was captured into a tower's prison. */
export class FollowerCaptured extends PlayEvent {
  static readonly simpleName = "FollowerCaptured";

  constructor(
    metadata: PlayEventMeta,
    private readonly follower: Follower,
    private readonly from: FeaturePointer,
  ) {
    super(metadata);
  }

  getFollower(): Follower {
    return this.follower;
  }
  getFrom(): FeaturePointer {
    return this.from;
  }
}
