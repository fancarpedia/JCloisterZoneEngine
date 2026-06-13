import { AbstractMessage } from "./AbstractMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

export type BuyOrSellOption = "BUY" | "SELL";

/** BAZAAR_BUY_OR_SELL — the selecting player buys at the bid price or sells to the bidder. */
export class BazaarBuyOrSellMessage extends AbstractMessage implements ReplayableMessage {
  static readonly command = "BAZAAR_BUY_OR_SELL";

  constructor(private readonly value: BuyOrSellOption) {
    super();
  }

  getValue(): BuyOrSellOption {
    return this.value;
  }
}
