import type { Set } from "../../../io/vavr/Set.js";
import type { PlacementOption } from "../board/PlacementOption.js";
import type { Tile } from "../board/Tile.js";
import { PlaceTileMessage } from "../io/message/PlaceTileMessage.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Action to place the drawn tile at one of the legal placement options. */
export class TilePlacementAction extends AbstractPlayerAction<PlacementOption> {
  private readonly tile: Tile;

  constructor(tile: Tile, options: Set<PlacementOption>) {
    super(options);
    this.tile = tile;
  }

  getTile(): Tile {
    return this.tile;
  }

  override select(tp: PlacementOption): PlaceTileMessage {
    return new PlaceTileMessage(this.tile.getId(), tp.getRotation(), tp.getPosition());
  }
}
