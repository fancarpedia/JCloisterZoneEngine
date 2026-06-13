import { AbstractMessage } from "./AbstractMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** PASS — decline the current optional action. */
export class PassMessage extends AbstractMessage implements ReplayableMessage {
  static readonly command = "PASS";
}
