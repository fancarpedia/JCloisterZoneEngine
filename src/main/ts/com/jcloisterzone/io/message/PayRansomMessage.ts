import { AbstractMessage } from "./AbstractMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** PAY_RANSOM — pay 3 points to free one of your captured followers. */
export class PayRansomMessage extends AbstractMessage implements ReplayableMessage {
  static readonly command = "PAY_RANSOM";

  constructor(private readonly meepleId: string) {
    super();
  }

  getMeepleId(): string {
    return this.meepleId;
  }
}
