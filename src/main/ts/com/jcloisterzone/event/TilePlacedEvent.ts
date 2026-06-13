import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import type { Tile } from "../board/Tile.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A tile was placed on the board. */
export class TilePlacedEvent extends PlayEvent {
  static readonly simpleName = "TilePlacedEvent";

  constructor(
    metadata: PlayEventMeta,
    private readonly tile: Tile,
    private readonly position: Position,
    private readonly rotation: Rotation,
  ) {
    super(metadata);
  }

  getTile(): Tile {
    return this.tile;
  }
  getPosition(): Position {
    return this.position;
  }
  getRotation(): Rotation {
    return this.rotation;
  }
}
