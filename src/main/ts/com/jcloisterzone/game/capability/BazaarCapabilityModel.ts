import type { Queue } from "../../../../io/vavr/SeqTypes.js";
import type { Player } from "../../Player.js";
import type { BazaarItem } from "./BazaarItem.js";

/** Bazaar auction state: the drawn supply, the currently auctioned index, the selecting player. */
export class BazaarCapabilityModel {
  constructor(
    private readonly supply: Queue<BazaarItem> | null = null,
    private readonly auctionedItemIndex: number | null = null,
    private readonly tileSelectingPlayer: Player | null = null,
  ) {}

  getSupply(): Queue<BazaarItem> | null {
    return this.supply;
  }
  getAuctionedItemIndex(): number | null {
    return this.auctionedItemIndex;
  }
  getAuctionedItem(): BazaarItem | null {
    if (this.auctionedItemIndex === null) return null;
    return this.supply!.get(this.auctionedItemIndex);
  }
  getTileSelectingPlayer(): Player | null {
    return this.tileSelectingPlayer;
  }
  setSupply(supply: Queue<BazaarItem> | null): BazaarCapabilityModel {
    return new BazaarCapabilityModel(supply, this.auctionedItemIndex, this.tileSelectingPlayer);
  }
  setAuctionedItemIndex(auctionedItemIndex: number | null): BazaarCapabilityModel {
    return new BazaarCapabilityModel(this.supply, auctionedItemIndex, this.tileSelectingPlayer);
  }
  setTileSelectingPlayer(tileSelectingPlayer: Player | null): BazaarCapabilityModel {
    return new BazaarCapabilityModel(this.supply, this.auctionedItemIndex, tileSelectingPlayer);
  }
  updateSupplyItem(index: number, item: BazaarItem): BazaarCapabilityModel {
    return this.setSupply(this.supply!.update(index, item) as Queue<BazaarItem>);
  }
}
