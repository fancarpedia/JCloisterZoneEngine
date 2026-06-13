import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

/** Vineyards (German Cathedrals promo) — vineyard tiles boost adjacent monasteries. */
export class VineyardCapability extends Capability<void> {
  static readonly VINEYARD = new TileModifier("Vineyard");

  override initTile(state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (!getElementStreamByTagName(tileElement, "vineyard").isEmpty()) {
      tile = tile.addTileModifier(VineyardCapability.VINEYARD);
    }
    return tile;
  }
}

Capability.register(VineyardCapability);
