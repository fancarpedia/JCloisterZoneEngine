import type { Player } from "../Player.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** Marks the start of a player's turn. */
export class PlayerTurnEvent extends PlayEvent {
  static readonly simpleName = "PlayerTurnEvent";

  private readonly player: Player;

  constructor(metadata: PlayEventMeta, player: Player) {
    super(metadata);
    this.player = player;
  }

  getPlayer(): Player {
    return this.player;
  }

  toString(): string {
    return super.toString() + " player:" + this.player;
  }
}
