import type { MeeplePointer } from "../../board/pointer/MeeplePointer.js";
import { AbstractMessage } from "./AbstractMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** CAPTURE_FOLLOWER — choose which follower a raised tower captures. */
export class CaptureFollowerMessage extends AbstractMessage implements ReplayableMessage {
  static readonly command = "CAPTURE_FOLLOWER";

  constructor(private pointer: MeeplePointer | null = null) {
    super();
  }

  getPointer(): MeeplePointer | null {
    return this.pointer;
  }
  setPointer(pointer: MeeplePointer | null): void {
    this.pointer = pointer;
  }
}
