import { JavaEnum } from "../../../../lang/JavaEnum.js";
import type { Tile } from "../../board/Tile.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { Capability } from "../Capability.js";
import type { Token } from "../Token.js";
import type { GameState } from "../state/GameState.js";

/** Abbey state: the abbey tile (defined in abbey_and_mayor.xml, a supply tile — never drawn) and,
 *  during the final abbey-placement round, the index of the player that round ends on. */
export class AbbeyModel {
  constructor(
    readonly tile: Tile | null,
    readonly endPlayer: number | null,
  ) {}

  setEndPlayer(endPlayer: number | null): AbbeyModel {
    return new AbbeyModel(this.tile, endPlayer);
  }
}

/** Abbey & Mayor — the abbey tile each player may place in a hole. The tile itself comes from the
 *  tile XML (`AM/A`: a monastery with an abbey edge on every side, in a `supply="true"` set). */
export class AbbeyCapability extends Capability<AbbeyModel> {
  static readonly ABBEY_TILE_ID = "AM/A";
  /** Max abbey tiles a player may start with (the `abbey` element is an integer count). */
  static readonly MAX_ABBEY_TILES = 9;

  override getSupplyTileIds(): readonly string[] {
    return [AbbeyCapability.ABBEY_TILE_ID];
  }

  override initSupplyTiles(state: GameState, tiles: ReadonlyMap<string, Tile>): GameState {
    return this.setModel(state, new AbbeyModel(tiles.get(AbbeyCapability.ABBEY_TILE_ID) ?? null, null));
  }

  /** The abbey tile of this game. Throws when the loaded XML doesn't define `AM/A`. */
  static getAbbeyTile(state: GameState): Tile {
    const model = state.getCapabilityModel<AbbeyModel>(AbbeyCapability as never);
    if (!model || !model.tile) {
      throw new Error(`The abbey tile ${AbbeyCapability.ABBEY_TILE_ID} is not defined in the loaded tile XML (abbey_and_mayor.xml)`);
    }
    return model.tile;
  }

  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    // The `abbey` element is an integer count (1..9) of abbey tiles each player gets.
    // A legacy boolean `true` (or any non-positive/invalid value) means a single tile.
    const raw = state.getElements().get("abbey").getOrNull();
    let count = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isInteger(count) || count < 1) count = 1;
    if (count > AbbeyCapability.MAX_ABBEY_TILES) count = AbbeyCapability.MAX_ABBEY_TILES;
    return state.mapPlayers((ps) =>
      ps.setTokenCountForAllPlayers(AbbeyCapability.AbbeyToken.ABBEY_TILE, count),
    );
  }

  static isAbbey(tile: Tile): boolean {
    return tile.getId() === AbbeyCapability.ABBEY_TILE_ID;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AbbeyCapability {
  export class AbbeyToken extends JavaEnum implements Token {
    static readonly ABBEY_TILE = new AbbeyToken("ABBEY_TILE", 0);
    private static readonly VALUES: readonly AbbeyToken[] = [AbbeyToken.ABBEY_TILE];
    static values(): readonly AbbeyToken[] {
      return AbbeyToken.VALUES;
    }
  }
}

Capability.register(AbbeyCapability);
