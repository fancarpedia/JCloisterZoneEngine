import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Buy the auctioned tile at the final bid, or sell it to the highest bidder. */
export class BazaarSelectBuyOrSellAction extends AbstractPlayerAction<void> {
  constructor() {
    super(null);
  }

  override isEmpty(): boolean {
    return false;
  }
}
