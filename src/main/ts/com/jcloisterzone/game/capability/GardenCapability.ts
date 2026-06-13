import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import { Tile } from "../../board/Tile.js";
import { Garden } from "../../feature/Garden.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

/** Gardens (German Monasteries promo) — adds a Garden monastic feature to tiles
 *  carrying a `<garden/>` element. */
export class GardenCapability extends Capability<void> {
  override initTile(state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (!getElementStreamByTagName(tileElement, "garden").isEmpty()) {
      const garden = new Garden();
      tile = tile.setInitialFeatures(tile.getInitialFeatures().put(garden.getPlace(), garden));
    }
    return tile;
  }
}

Capability.register(GardenCapability);
