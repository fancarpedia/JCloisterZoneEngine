import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** Marks a double turn (e.g. after the abbot / certain expansions). */
export class DoubleTurnEvent extends PlayEvent {
  static readonly simpleName = "DoubleTurnEvent";

  constructor(metadata: PlayEventMeta) {
    super(metadata);
  }
}
