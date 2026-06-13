import type { Player } from "../Player.js";
import type { Tile } from "../board/Tile.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

export type BuyOrSellOption = "BUY" | "SELL";

/** A bazaar tile was bought/sold (Bridges, Castles & Bazaars). */
export class TileAuctionedEvent extends PlayEvent {
  static readonly simpleName = "TileAuctionedEvent";

  constructor(
    metadata: PlayEventMeta,
    private readonly tile: Tile,
    private readonly option: BuyOrSellOption,
    private readonly points: number,
    private readonly auctioneer: Player,
    private readonly bidder: Player | null,
  ) {
    super(metadata);
  }

  getTile(): Tile {
    return this.tile;
  }
  getOption(): BuyOrSellOption {
    return this.option;
  }
  getPoints(): number {
    return this.points;
  }
  getAuctioneer(): Player {
    return this.auctioneer;
  }
  getBidder(): Player | null {
    return this.bidder;
  }
}
