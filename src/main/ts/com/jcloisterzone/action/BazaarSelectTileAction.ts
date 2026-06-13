import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Choose which bazaar supply tile to auction (or take, when no-auction). */
export class BazaarSelectTileAction extends AbstractPlayerAction<void> {
  constructor(private readonly noAuction: boolean) {
    super(null);
  }

  getNoAuction(): boolean {
    return this.noAuction;
  }

  override isEmpty(): boolean {
    return false;
  }
}
