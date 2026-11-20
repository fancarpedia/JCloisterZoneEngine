import type { Location } from "../board/Location.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import type { Meeple } from "../figure/Meeple.js";
import type { PlacementCause } from "./PlacementCause.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A meeple was deployed (possibly moved). */
export class MeepleDeployed extends PlayEvent {
  static readonly simpleName = "MeepleDeployed";

  constructor(
    metadata: PlayEventMeta,
    private readonly meeple: Meeple,
    private readonly ptr: BoardPointer,
    private readonly movedFrom: BoardPointer | null = null,
    private readonly cause: PlacementCause | null = null,
    /** TS-only: the meeples this one joined on its feature, where they stood — e.g. a crop circle
     *  adds a follower next to the player's own: the history draws them together. */
    private readonly alongside: ReadonlyArray<readonly [Meeple, FeaturePointer]> = [],
  ) {
    super(metadata);
  }

  getAlongside(): ReadonlyArray<readonly [Meeple, FeaturePointer]> {
    return this.alongside;
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

  /** What triggered this when no player chose it directly (TS-only). */
  getCause(): PlacementCause | null {
    return this.cause;
  }
}
