import type { Player } from "../Player.js";
import type { Follower } from "../figure/Follower.js";
import type { Meeple } from "../figure/Meeple.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A player paid ransom to free a captured follower (Tower). */
export class RansomPaidEvent extends PlayEvent {
  static readonly simpleName = "RansomPaidEvent";

  constructor(
    metadata: PlayEventMeta,
    private readonly follower: Follower,
    private readonly jailer: Player,
  ) {
    super(metadata);
  }

  getMeeple(): Meeple {
    return this.follower;
  }
  getJailer(): Player {
    return this.jailer;
  }
}
