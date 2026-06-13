import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import type { Token } from "../game/Token.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A player-supply token (little building, bridge, tower piece, ...) was placed. */
export class TokenPlacedEvent extends PlayEvent {
  static readonly simpleName = "TokenPlacedEvent";

  constructor(
    metadata: PlayEventMeta,
    private readonly token: Token,
    private readonly pointer: BoardPointer,
  ) {
    super(metadata);
  }

  getToken(): Token {
    return this.token;
  }

  getPointer(): BoardPointer {
    return this.pointer;
  }
}
