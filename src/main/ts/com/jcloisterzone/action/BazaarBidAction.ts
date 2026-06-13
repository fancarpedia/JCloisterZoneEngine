import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Raise the bid on the auctioned bazaar tile (or pass). */
export class BazaarBidAction extends AbstractPlayerAction<void> {
  constructor() {
    super(null);
  }

  override isEmpty(): boolean {
    return false;
  }
}
