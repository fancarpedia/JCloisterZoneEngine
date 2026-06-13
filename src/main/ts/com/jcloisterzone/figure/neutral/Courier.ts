import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { NeutralFigure } from "./NeutralFigure.js";

/** The Courier (The Courier promo). */
export class Courier extends NeutralFigure<BoardPointer> {
  static readonly simpleName = "Courier";
  constructor(id: string) {
    super(id);
  }
}
