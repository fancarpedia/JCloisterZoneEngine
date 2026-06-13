import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

/** Hills &amp; Sheep — hill tiles (follower-count tiebreaker). */
export class HillCapability extends Capability<void> {
  static readonly HILL = new TileModifier("Hill");

  override initTile(state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (!getElementStreamByTagName(tileElement, "hill").isEmpty()) {
      tile = tile.addTileModifier(HillCapability.HILL);
    }
    return tile;
  }
}

Capability.register(HillCapability);
