import type { Set } from "../../../io/vavr/Set.js";
import type { Position } from "../board/Position.js";
import { SelectTileAction } from "./SelectTileAction.js";

/** Move the fairy onto a tile (the "on-tile" fairy placement variant). */
export class FairyOnTileAction extends SelectTileAction {
  static readonly simpleName = "FairyOnTileAction";

  constructor(
    private readonly figureId: string,
    options: Set<Position>,
  ) {
    super(options);
  }

  getFigureId(): string {
    return this.figureId;
  }
}
