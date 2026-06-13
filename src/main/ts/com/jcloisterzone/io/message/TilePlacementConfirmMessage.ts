import { AbstractMessage } from "./AbstractMessage.js";
import type { RandomChangingMessage } from "./RandomChangingMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** TILE_CONFIRM — confirm a placed crater tile (Meteorites); carries the impact-roll seed. */
export class TilePlacementConfirmMessage
  extends AbstractMessage
  implements ReplayableMessage, RandomChangingMessage
{
  static readonly command = "TILE_CONFIRM";

  private random: number | null = null;

  getRandom(): number | null {
    return this.random;
  }
  setRandom(random: number | null): void {
    this.random = random;
  }
}
