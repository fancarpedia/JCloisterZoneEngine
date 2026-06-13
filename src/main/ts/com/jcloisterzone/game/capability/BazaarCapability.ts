import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import type { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";
import { BazaarCapabilityModel } from "./BazaarCapabilityModel.js";

/** Bazaars (Bridges, Castles & Bazaars): bazaar tiles trigger a tile auction. */
export class BazaarCapability extends Capability<BazaarCapabilityModel> {
  static readonly BAZAAR = new TileModifier("Bazaar");

  override initTile(_state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (!getElementStreamByTagName(tileElement, "bazaar").isEmpty()) {
      tile = tile.addTileModifier(BazaarCapability.BAZAAR);
    }
    return tile;
  }

  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    return this.setModel(state, new BazaarCapabilityModel());
  }

  override onTurnCleanUp(state: GameState): GameState {
    return this.updateModel(state, (model) => {
      const supply = model.getSupply();
      if (supply !== null && supply.isEmpty()) {
        return model.setSupply(null);
      }
      return model;
    });
  }
}

Capability.register(BazaarCapability);
