import type { Player } from "../../Player.js";
import type { Tile } from "../../board/Tile.js";

/** One tile in the bazaar supply with its auction state. */
export class BazaarItem {
  constructor(
    private readonly tile: Tile,
    private readonly currentPrice: number,
    private readonly currentBidder: Player | null,
    private readonly owner: Player | null,
  ) {}

  getTile(): Tile {
    return this.tile;
  }
  getCurrentPrice(): number {
    return this.currentPrice;
  }
  getCurrentBidder(): Player | null {
    return this.currentBidder;
  }
  getOwner(): Player | null {
    return this.owner;
  }
  setCurrentPrice(currentPrice: number): BazaarItem {
    return new BazaarItem(this.tile, currentPrice, this.currentBidder, this.owner);
  }
  setCurrentBidder(currentBidder: Player | null): BazaarItem {
    return new BazaarItem(this.tile, this.currentPrice, currentBidder, this.owner);
  }
  setOwner(owner: Player | null): BazaarItem {
    return new BazaarItem(this.tile, this.currentPrice, this.currentBidder, owner);
  }
}
