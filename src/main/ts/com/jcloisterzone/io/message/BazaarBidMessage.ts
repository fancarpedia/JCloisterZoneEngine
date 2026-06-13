import { AbstractMessage } from "./AbstractMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** BAZAAR_BID — select a supply tile (tile selection) or raise the bid. */
export class BazaarBidMessage extends AbstractMessage implements ReplayableMessage {
  static readonly command = "BAZAAR_BID";

  constructor(
    private readonly supplyIndex: number,
    private readonly price: number,
  ) {
    super();
  }

  getSupplyIndex(): number {
    return this.supplyIndex;
  }
  getPrice(): number {
    return this.price;
  }
}
