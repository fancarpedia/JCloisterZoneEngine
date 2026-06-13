import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { NeutralFigure } from "./NeutralFigure.js";

/** The Donkey (Under the Big Top). */
export class Donkey extends NeutralFigure<BoardPointer> {
  static readonly simpleName = "Donkey";
  constructor(id: string) {
    super(id);
  }
}
