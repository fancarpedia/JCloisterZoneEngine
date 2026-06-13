import { AbstractMessage } from "./AbstractMessage.js";
import type { RandomChangingMessage } from "./RandomChangingMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** AI — request the engine to compute the move for the given (active) player. The
 *  engine replies with an AI_MESSAGE wrapping the chosen move. */
export class AiMessage extends AbstractMessage implements ReplayableMessage, RandomChangingMessage {
  static readonly command = "AI";

  private random: number | null = null;
  private player: number | null = null;
  private seq: number | null = null;

  getRandom(): number | null {
    return this.random;
  }
  setRandom(random: number | null): void {
    this.random = random;
  }
  getPlayer(): number | null {
    return this.player;
  }
  setPlayer(player: number | null): void {
    this.player = player;
  }
  getSeq(): number | null {
    return this.seq;
  }
  setSeq(seq: number | null): void {
    this.seq = seq;
  }
}
