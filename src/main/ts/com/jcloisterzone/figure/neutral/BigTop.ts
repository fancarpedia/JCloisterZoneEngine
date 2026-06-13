import type { Position } from "../../board/Position.js";
import { NeutralFigure } from "./NeutralFigure.js";

/** The Big Top (Under the Big Top). */
export class BigTop extends NeutralFigure<Position> {
  static readonly simpleName = "BigTop";
  constructor(id: string) {
    super(id);
  }
}
