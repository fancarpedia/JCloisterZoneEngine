import type { MeeplePointer } from "../../board/pointer/MeeplePointer.js";
import type { ReturnMeepleSource } from "../../game/ReturnMeepleSource.js";
import { AbstractMessage } from "./AbstractMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** RETURN_MEEPLE — return (undeploy) a follower via a source effect (princess, festival,
 *  trap, abbot return, ...). */
export class ReturnMeepleMessage extends AbstractMessage implements ReplayableMessage {
  static readonly command = "RETURN_MEEPLE";

  constructor(
    private pointer: MeeplePointer | null = null,
    private source: ReturnMeepleSource | null = null,
  ) {
    super();
  }

  getPointer(): MeeplePointer | null {
    return this.pointer;
  }
  setPointer(pointer: MeeplePointer | null): void {
    this.pointer = pointer;
  }
  getReturnMeepleSource(): ReturnMeepleSource | null {
    return this.source;
  }
  setSource(source: ReturnMeepleSource | null): void {
    this.source = source;
  }
}
