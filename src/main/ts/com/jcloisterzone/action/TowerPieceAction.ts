import type { Set } from "../../../io/vavr/Set.js";
import type { Position } from "../board/Position.js";
import type { TowerCapability } from "../game/capability/TowerCapability.js";
import { SelectTileAction } from "./SelectTileAction.js";

/** Offer to place a tower piece (TOWER_PIECE / BLACK / WHITE) on a tower position. */
export class TowerPieceAction extends SelectTileAction {
  static readonly simpleName = "TowerPieceAction";

  constructor(
    options: Set<Position>,
    private readonly token: TowerCapability.TowerToken,
  ) {
    super(options);
  }

  getToken(): TowerCapability.TowerToken {
    return this.token;
  }
}
