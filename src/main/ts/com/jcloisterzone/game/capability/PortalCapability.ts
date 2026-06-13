import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import type { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

/** Magic Portal (Princess & the Dragon) — a tile that lets the turn player deploy a follower
 *  onto any feature anywhere on the board (once per turn). */
export class PortalCapability extends Capability<void> {
  static readonly MAGIC_PORTAL = new TileModifier("MagicPortal");

  override initTile(_state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (!getElementStreamByTagName(tileElement, "portal").isEmpty()) {
      tile = tile.addTileModifier(PortalCapability.MAGIC_PORTAL);
    }
    return tile;
  }
}

Capability.register(PortalCapability);
