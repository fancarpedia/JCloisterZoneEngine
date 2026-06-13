import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import type { Token } from "../game/Token.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A supply token was removed from the board (e.g. a meteorite destroys a gold piece). */
export class TokenRemovedEvent extends PlayEvent {
  static readonly simpleName = "TokenRemovedEvent";

  constructor(
    metadata: PlayEventMeta,
    private readonly token: Token,
    private readonly pointer: BoardPointer,
    private readonly count: number,
    private readonly forced: boolean,
  ) {
    super(metadata);
  }

  getToken(): Token {
    return this.token;
  }
  getPointer(): BoardPointer {
    return this.pointer;
  }
  getCount(): number {
    return this.count;
  }
  getForced(): boolean {
    return this.forced;
  }
}
