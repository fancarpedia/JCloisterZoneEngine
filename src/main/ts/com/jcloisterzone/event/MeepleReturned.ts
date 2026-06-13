import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Meeple } from "../figure/Meeple.js";
import type { ReturnMeepleSource } from "../game/ReturnMeepleSource.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A meeple was returned to its owner's supply. */
export class MeepleReturned extends PlayEvent {
  static readonly simpleName = "MeepleReturned";

  constructor(
    metadata: PlayEventMeta,
    private readonly meeple: Meeple,
    private readonly from: FeaturePointer,
    /** true if returned by means other than scoring the feature */
    private readonly forced: boolean,
    private readonly returnMeepleSource: ReturnMeepleSource | null,
  ) {
    super(metadata);
  }

  getMeeple(): Meeple {
    return this.meeple;
  }
  getFrom(): FeaturePointer {
    return this.from;
  }
  isForced(): boolean {
    return this.forced;
  }
  getReturnMeepleSource(): ReturnMeepleSource | null {
    return this.returnMeepleSource;
  }
}
