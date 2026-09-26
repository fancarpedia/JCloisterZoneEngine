import type { Player } from "../Player.js";
import type { Position } from "../board/Position.js";
import type { Meeple } from "../figure/Meeple.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/**
 * A player was handed a NEW meeple during play — one that was not in their starting supply.
 * Today only Mini Meeple does this (awarded for filling a hole, see MiniMeepleCapability);
 * the event is deliberately generic so another expansion can reuse it.
 *
 * `position` is the tile placement that earned it, so the client can highlight that tile
 * when the history entry is hovered.
 */
export class MeepleAwardedEvent extends PlayEvent {
  static readonly simpleName = "MeepleAwardedEvent";

  constructor(
    metadata: PlayEventMeta,
    private readonly player: Player,
    private readonly meeple: Meeple,
    private readonly position: Position,
  ) {
    super(metadata);
  }

  getPlayer(): Player {
    return this.player;
  }
  getMeeple(): Meeple {
    return this.meeple;
  }
  getPosition(): Position {
    return this.position;
  }
}
