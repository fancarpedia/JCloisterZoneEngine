import type { Set } from "../../../io/vavr/Set.js";
import type { Position } from "../board/Position.js";
import { SelectTileAction } from "./SelectTileAction.js";

/** Offer to move the donkey to another placed tile. */
export class DonkeyAction extends SelectTileAction {
  static readonly simpleName = "DonkeyAction";

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
