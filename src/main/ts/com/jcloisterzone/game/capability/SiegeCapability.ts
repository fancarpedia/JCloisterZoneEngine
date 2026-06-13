import { attributeBoolValue, getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import type { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

/** The Siege (Cathars / Siege of Carcassonne) expansion. Besieged-city scoring is driven by the
 *  {@code City.BESIEGED} modifier; this capability marks tiles bearing a besieged city so the
 *  Escape variant can recognise valid escape tiles. */
export class SiegeCapability extends Capability<void> {
  static readonly SIEGE_ESCAPE_TILE = new TileModifier("SiegeEscapeTile");

  override initTile(_state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    const hasBesieged = !getElementStreamByTagName(tileElement, "city")
      .filter((cityEl) => attributeBoolValue(cityEl, "besieged"))
      .isEmpty();
    if (hasBesieged) {
      tile = tile.addTileModifier(SiegeCapability.SIEGE_ESCAPE_TILE);
    }
    return tile;
  }
}

Capability.register(SiegeCapability);
