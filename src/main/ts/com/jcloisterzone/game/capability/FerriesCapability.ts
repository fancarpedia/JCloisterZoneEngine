import { HashMap } from "../../../../io/vavr/Map.js";
import { JavaEnum } from "../../../../lang/JavaEnum.js";
import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { Capability } from "../Capability.js";
import type { Token } from "../Token.js";
import type { GameState } from "../state/GameState.js";
import { FerriesCapabilityModel } from "./FerriesCapabilityModel.js";

/** Ferries (Mini-expansion) — lake ferries that connect roads. */
export class FerriesCapability extends Capability<FerriesCapabilityModel> {
  static readonly LAKE_FERRY = new TileModifier("LakeFerry");

  override initTile(state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (!getElementStreamByTagName(tileElement, "ferry").isEmpty()) {
      tile = tile.addTileModifier(FerriesCapability.LAKE_FERRY);
    }
    return tile;
  }

  override onStartGame(state: GameState, random: RandomGenerator): GameState {
    return this.setModel(state, new FerriesCapabilityModel());
  }

  override onTurnPartCleanUp(state: GameState): GameState {
    return this.updateModel(state, (m) => m.setMovedFerries(HashMap.empty()));
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FerriesCapability {
  /** Player-supply token for ferries. */
  export class FerryToken extends JavaEnum implements Token {
    static readonly FERRY = new FerryToken("FERRY", 0);
    private static readonly VALUES: readonly FerryToken[] = [FerryToken.FERRY];
    static values(): readonly FerryToken[] {
      return FerryToken.VALUES;
    }
  }
}

Capability.register(FerriesCapability);
