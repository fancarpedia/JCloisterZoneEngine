import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import type { Token } from "../game/Token.js";
import type { PlacementCause } from "./PlacementCause.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A player-supply token (little building, bridge, tower piece, ...) was placed. */
export class TokenPlacedEvent extends PlayEvent {
  static readonly simpleName = "TokenPlacedEvent";

  constructor(
    metadata: PlayEventMeta,
    private readonly token: Token,
    private readonly pointer: BoardPointer,
    private readonly cause: PlacementCause | null = null,
  ) {
    super(metadata);
  }

  getToken(): Token {
    return this.token;
  }

  getPointer(): BoardPointer {
    return this.pointer;
  }

  /** What triggered this when no player chose it directly (TS-only). */
  getCause(): PlacementCause | null {
    return this.cause;
  }
}
