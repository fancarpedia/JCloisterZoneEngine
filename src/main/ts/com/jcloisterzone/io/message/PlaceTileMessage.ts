import type { Position } from "../../board/Position.js";
import type { Rotation } from "../../board/Rotation.js";
import { AbstractMessage } from "./AbstractMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** PLACE_TILE — place the drawn tile at a position/rotation. */
export class PlaceTileMessage extends AbstractMessage implements ReplayableMessage {
  static readonly command = "PLACE_TILE";

  private tileId: string | null;
  private rotation: Rotation | null;
  private position: Position | null;

  constructor(tileId: string | null = null, rotation: Rotation | null = null, position: Position | null = null) {
    super();
    this.tileId = tileId;
    this.rotation = rotation;
    this.position = position;
  }

  getTileId(): string | null {
    return this.tileId;
  }
  setTileId(tileId: string | null): void {
    this.tileId = tileId;
  }
  getRotation(): Rotation | null {
    return this.rotation;
  }
  setRotation(rotation: Rotation | null): void {
    this.rotation = rotation;
  }
  getPosition(): Position | null {
    return this.position;
  }
  setPosition(position: Position | null): void {
    this.position = position;
  }
}
