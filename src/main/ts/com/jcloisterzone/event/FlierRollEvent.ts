import type { Position } from "../board/Position.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A flying-machine die roll: the meeple flies `distance` tiles from `position`. */
export class FlierRollEvent extends PlayEvent {
  constructor(
    metadata: PlayEventMeta,
    private readonly position: Position,
    private readonly distance: number,
  ) {
    super(metadata);
  }

  getPosition(): Position {
    return this.position;
  }
  getDistance(): number {
    return this.distance;
  }
}
