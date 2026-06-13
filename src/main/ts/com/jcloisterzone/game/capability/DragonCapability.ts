import { Vector } from "../../../../io/vavr/SeqTypes.js";
import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import type { Position } from "../../board/Position.js";
import type { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { Dragon } from "../../figure/neutral/Dragon.js";
import type { NeutralFigure } from "../../figure/neutral/NeutralFigure.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { MoveNeutralFigure } from "../../reducers/MoveNeutralFigure.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";
import type { PlacedTile } from "../state/PlacedTile.js";

/** The Dragon (Princess & the Dragon) — a volcano tile summons it; dragon-trigger tiles then
 *  let it walk 6 tiles, eating any meeple it lands on. Model = the path of visited positions. */
export class DragonCapability extends Capability<Vector<Position>> {
  static readonly VOLCANO = new TileModifier("Volcano");
  static readonly DRAGON_TRIGGER = new TileModifier("DragonTrigger");
  static readonly DRAGON_MOVES = 6;
  static readonly TILE_GROUP_DRAGON = "dragon";

  override initTile(_state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (!getElementStreamByTagName(tileElement, "volcano").isEmpty()) {
      tile = tile.addTileModifier(DragonCapability.VOLCANO);
    }
    if (!getElementStreamByTagName(tileElement, "dragon").isEmpty()) {
      tile = tile.addTileModifier(DragonCapability.DRAGON_TRIGGER);
    }
    return tile;
  }

  override getTileGroup(tile: Tile): string | null {
    return tile.hasModifier(DragonCapability.DRAGON_TRIGGER) ? DragonCapability.TILE_GROUP_DRAGON : null;
  }

  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    state = state.mapNeutralFigures((nf) => nf.setDragon(new Dragon("dragon.1")));
    state = state.mapTilePack((pack) => pack.deactivateGroup(DragonCapability.TILE_GROUP_DRAGON));
    return this.setModel(state, Vector.empty<Position>());
  }

  override onTilePlaced(state: GameState, pt: PlacedTile): GameState {
    if (pt.getTile().hasModifier(DragonCapability.VOLCANO)) {
      state = state.mapTilePack((pack) => pack.activateGroup(DragonCapability.TILE_GROUP_DRAGON));
      state = new MoveNeutralFigure(
        state.getNeutralFigures().getDragon() as unknown as NeutralFigure<BoardPointer>,
        pt.getPosition() as unknown as BoardPointer,
      ).apply(state);
    }
    return state;
  }

  override isMeepleDeploymentAllowed(state: GameState, pos: Position): boolean {
    const dragonPos = state.getNeutralFigures().getDragonDeployment();
    return dragonPos === null || !pos.equals(dragonPos);
  }
}

Capability.register(DragonCapability);
