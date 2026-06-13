import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { AbstractMessage } from "./AbstractMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** SCORE_ACROBATS — score a full (3-meeple) acrobats space. */
export class ScoreAcrobatsMessage extends AbstractMessage implements ReplayableMessage {
  static readonly command = "SCORE_ACROBATS";

  private pointer: FeaturePointer | null;

  constructor(pointer: FeaturePointer | null = null) {
    super();
    this.pointer = pointer;
  }

  getPointer(): FeaturePointer | null {
    return this.pointer;
  }
  setPointer(pointer: FeaturePointer | null): void {
    this.pointer = pointer;
  }
}
