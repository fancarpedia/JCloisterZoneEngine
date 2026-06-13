import type { Set } from "../../../io/vavr/Set.js";
import type { Position } from "../board/Position.js";
import { SelectTileAction } from "./SelectTileAction.js";

/** Offer to place the second gold piece on one of the tiles around a goldmine. */
export class GoldPieceAction extends SelectTileAction {
  static readonly simpleName = "GoldPieceAction";

  constructor(options: Set<Position>) {
    super(options);
  }
}
