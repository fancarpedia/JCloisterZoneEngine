import { AbstractMessage } from "./AbstractMessage.js";
import type { RandomChangingMessage } from "./RandomChangingMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** SHEPHERD_CONFIRM — confirm a just-placed shepherd (draws the first sheep token). */
export class ShepherdPlacementConfirmMessage
  extends AbstractMessage
  implements ReplayableMessage, RandomChangingMessage
{
  static readonly command = "SHEPHERD_CONFIRM";

  private random: number | null = null;

  getRandom(): number | null {
    return this.random;
  }
  setRandom(random: number | null): void {
    this.random = random;
  }
}
