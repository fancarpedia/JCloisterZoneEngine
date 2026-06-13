import { AbstractMessage } from "./AbstractMessage.js";
import type { RandomChangingMessage } from "./RandomChangingMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** COMMIT — end the player's turn/step (carries the next random seed). */
export class CommitMessage extends AbstractMessage implements ReplayableMessage, RandomChangingMessage {
  static readonly command = "COMMIT";

  private random: number | null = null;

  getRandom(): number | null {
    return this.random;
  }
  setRandom(random: number | null): void {
    this.random = random;
  }
}
