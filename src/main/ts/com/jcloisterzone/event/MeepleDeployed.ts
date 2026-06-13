import type { Location } from "../board/Location.js";
import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import type { Meeple } from "../figure/Meeple.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A meeple was deployed (possibly moved). */
export class MeepleDeployed extends PlayEvent {
  static readonly simpleName = "MeepleDeployed";

  constructor(
    metadata: PlayEventMeta,
    private readonly meeple: Meeple,
    private readonly ptr: BoardPointer,
    private readonly movedFrom: BoardPointer | null = null,
  ) {
    super(metadata);
  }

  getMeeple(): Meeple {
    return this.meeple;
  }
  getPointer(): BoardPointer {
    return this.ptr;
  }
  getLocation(): Location | null {
    return this.ptr.asFeaturePointer().getLocation();
  }
  getMovedFrom(): BoardPointer | null {
    return this.movedFrom;
  }
}
