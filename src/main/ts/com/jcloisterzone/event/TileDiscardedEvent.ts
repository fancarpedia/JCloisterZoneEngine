import type { Tile } from "../board/Tile.js";
import { PlayEvent, PlayEventMeta } from "./PlayEvent.js";

/** A drawn tile was discarded (no legal placement). */
export class TileDiscardedEvent extends PlayEvent {
  static readonly simpleName = "TileDiscardedEvent";

  constructor(private readonly tile: Tile) {
    super(PlayEventMeta.createWithoutPlayer());
  }

  getTile(): Tile {
    return this.tile;
  }
}
