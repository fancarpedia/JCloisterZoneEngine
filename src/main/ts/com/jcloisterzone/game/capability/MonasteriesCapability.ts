import { RemoveTileException } from "../../board/RemoveTileException.js";
import { Tile } from "../../board/Tile.js";
import type { XmlElement } from "../../XmlUtils.js";
import { Capability } from "../Capability.js";
import { Rule } from "../Rule.js";
import type { GameState } from "../state/GameState.js";

/** Monasteries of Germany/etc. — when the KEEP_MONASTERIES rule is "replace",
 *  the two base cloister tiles are removed (replaced by the special monasteries). */
export class MonasteriesCapability extends Capability<void> {
  override initTile(state: GameState, tile: Tile, _tileElement: XmlElement): Tile {
    if (state.getStringRule(Rule.KEEP_MONASTERIES) === "replace") {
      if (tile.getId() === "BA/L" || tile.getId() === "BA/LR") {
        throw new RemoveTileException();
      }
    }
    return tile;
  }
}

Capability.register(MonasteriesCapability);
