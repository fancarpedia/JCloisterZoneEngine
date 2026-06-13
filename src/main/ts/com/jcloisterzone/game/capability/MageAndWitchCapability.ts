import { TileModifier } from "../../board/TileModifier.js";
import { Tile } from "../../board/Tile.js";
import { Mage } from "../../figure/neutral/Mage.js";
import { Witch } from "../../figure/neutral/Witch.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import type { XmlElement } from "../../XmlUtils.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

/** Mage &amp; Witch (Mage &amp; Witch mini-expansion). The mage adds +1/tile to the
 *  feature it sits on; the witch halves the feature's points. Tiles with a `<mage>`
 *  element carry the MAGE_TRIGGER modifier (placing one lets the player move them). */
export class MageAndWitchCapability extends Capability<void> {
  static readonly MAGE_TRIGGER = new TileModifier("MageTrigger");

  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    return state.setNeutralFigures(
      state.getNeutralFigures().setMage(new Mage("mage.1")).setWitch(new Witch("witch.1")),
    );
  }

  override initTile(_state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (tileElement.getElementsByTagName("mage").length > 0) {
      tile = tile.addTileModifier(MageAndWitchCapability.MAGE_TRIGGER);
    }
    return tile;
  }
}

Capability.register(MageAndWitchCapability);
