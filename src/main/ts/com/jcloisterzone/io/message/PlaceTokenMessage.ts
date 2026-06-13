import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import type { Token } from "../../game/Token.js";
import { AbstractMessage } from "./AbstractMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** PLACE_TOKEN — place a player-supply token (little building, bridge, tower piece, ...). */
export class PlaceTokenMessage extends AbstractMessage implements ReplayableMessage {
  static readonly command = "PLACE_TOKEN";

  private token: Token | null;
  private pointer: BoardPointer | null;

  constructor(token: Token | null = null, pointer: BoardPointer | null = null) {
    super();
    this.token = token;
    this.pointer = pointer;
  }

  getToken(): Token | null {
    return this.token;
  }
  setToken(token: Token | null): void {
    this.token = token;
  }
  getPointer(): BoardPointer | null {
    return this.pointer;
  }
  setPointer(pointer: BoardPointer | null): void {
    this.pointer = pointer;
  }
}
