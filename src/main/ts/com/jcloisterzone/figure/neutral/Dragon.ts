import type { Position } from "../../board/Position.js";
import { NeutralFigure } from "./NeutralFigure.js";

/** The Dragon (Princess &amp; Dragon). */
export class Dragon extends NeutralFigure<Position> {
  static readonly simpleName = "Dragon";
  constructor(id: string) {
    super(id);
  }
}
