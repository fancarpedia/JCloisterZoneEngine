import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { AbstractMessage } from "./AbstractMessage.js";
import type { NonUndoableMessage } from "./NonUndoableMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/**
 * SCORE_FIRST - the turn player picks which completed feature is scored first, when the order
 * changes the result (two or more features beside one castle: the castle takes the points of
 * whichever is scored first). Never undoable.
 */
export class ScoreFirstMessage extends AbstractMessage implements ReplayableMessage, NonUndoableMessage {
  static readonly command = "SCORE_FIRST";

  readonly nonUndoable = true as const;

  private pointer: FeaturePointer | null;

  constructor(pointer: FeaturePointer | null = null) {
    super();
    this.pointer = pointer;
  }

  getPointer(): FeaturePointer | null {
    return this.pointer;
  }
}
