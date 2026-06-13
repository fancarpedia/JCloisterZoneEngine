import type { Castle } from "../feature/Castle.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A 2-tile city was converted into a castle. */
export class CastleCreated extends PlayEvent {
  private readonly castle: Castle;

  constructor(metadata: PlayEventMeta, castle: Castle) {
    super(metadata);
    this.castle = castle;
  }

  getCastle(): Castle {
    return this.castle;
  }
}
