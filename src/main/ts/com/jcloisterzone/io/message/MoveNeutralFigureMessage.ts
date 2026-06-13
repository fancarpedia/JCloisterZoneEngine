import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { AbstractMessage } from "./AbstractMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** MOVE_NEUTRAL_FIGURE — move a neutral figure (fairy/dragon/...) to a pointer. */
export class MoveNeutralFigureMessage extends AbstractMessage implements ReplayableMessage {
  static readonly command = "MOVE_NEUTRAL_FIGURE";

  constructor(
    private figureId: string | null = null,
    private to: BoardPointer | null = null,
  ) {
    super();
  }

  getFigureId(): string | null {
    return this.figureId;
  }
  setFigureId(figureId: string | null): void {
    this.figureId = figureId;
  }
  getTo(): BoardPointer | null {
    return this.to;
  }
  setTo(to: BoardPointer | null): void {
    this.to = to;
  }
}
