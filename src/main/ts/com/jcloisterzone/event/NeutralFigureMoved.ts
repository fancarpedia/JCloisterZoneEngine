import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import type { NeutralFigure } from "../figure/neutral/NeutralFigure.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A neutral figure (fairy/dragon/...) moved from one pointer to another. */
export class NeutralFigureMoved extends PlayEvent {
  static readonly simpleName = "NeutralFigureMoved";

  constructor(
    metadata: PlayEventMeta,
    private readonly neutralFigure: NeutralFigure<BoardPointer>,
    private readonly from: BoardPointer | null,
    private readonly to: BoardPointer | null,
  ) {
    super(metadata);
  }

  getFrom(): BoardPointer | null {
    return this.from;
  }
  getTo(): BoardPointer | null {
    return this.to;
  }
  getNeutralFigure(): NeutralFigure<BoardPointer> {
    return this.neutralFigure;
  }
}
