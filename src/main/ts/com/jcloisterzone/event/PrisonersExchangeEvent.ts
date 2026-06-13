import type { Follower } from "../figure/Follower.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** Two captured followers were swapped back to their owners (Tower). */
export class PrisonersExchangeEvent extends PlayEvent {
  static readonly simpleName = "PrisonersExchangeEvent";

  constructor(
    metadata: PlayEventMeta,
    private readonly first: Follower,
    private readonly second: Follower,
  ) {
    super(metadata);
  }

  getFirst(): Follower {
    return this.first;
  }
  getSecond(): Follower {
    return this.second;
  }
}
