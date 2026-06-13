import { AbstractMessage } from "./AbstractMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** EXCHANGE_FOLLOWER — choose which captured follower to return when several types qualify. */
export class ExchangeFollowerChoiceMessage extends AbstractMessage implements ReplayableMessage {
  static readonly command = "EXCHANGE_FOLLOWER";

  constructor(private readonly meepleId: string) {
    super();
  }

  getMeepleId(): string {
    return this.meepleId;
  }
}
