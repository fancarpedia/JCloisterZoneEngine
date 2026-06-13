import type { Set } from "../../../io/vavr/Set.js";
import type { Position } from "../board/Position.js";
import { SelectTileAction } from "./SelectTileAction.js";

/** Offer to move the Dragon to one of the adjacent tiles. */
export class MoveDragonAction extends SelectTileAction {
  static readonly simpleName = "MoveDragonAction";

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
