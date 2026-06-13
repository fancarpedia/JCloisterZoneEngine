import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import type { NeutralFigure } from "../figure/neutral/NeutralFigure.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A neutral figure (mage/witch/…) was returned off the board (e.g. its feature scored). */
export class NeutralFigureReturned extends PlayEvent {
  constructor(
    metadata: PlayEventMeta,
    private readonly neutralFigure: NeutralFigure<BoardPointer>,
    private readonly from: BoardPointer | null,
  ) {
    super(metadata);
  }

  getNeutralFigure(): NeutralFigure<BoardPointer> {
    return this.neutralFigure;
  }

  getFrom(): BoardPointer | null {
    return this.from;
  }
}
