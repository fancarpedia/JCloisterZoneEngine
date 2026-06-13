import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { NeutralFigure } from "./NeutralFigure.js";

/** The Fairy (Princess &amp; Dragon). */
export class Fairy extends NeutralFigure<BoardPointer> {
  static readonly simpleName = "Fairy";
  constructor(id: string) {
    super(id);
  }
}
