import { Location } from "../../board/Location.js";
import { Position } from "../../board/Position.js";
import type { Tile } from "../../board/Tile.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { Feature } from "../../feature/Feature.js";
import { Quarter } from "../../feature/Quarter.js";
import { Count } from "../../figure/neutral/Count.js";
import type { NeutralFigure } from "../../figure/neutral/NeutralFigure.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { MoveNeutralFigure } from "../../reducers/MoveNeutralFigure.js";
import { Capability } from "../Capability.js";
import type { XmlElement } from "../../XmlUtils.js";
import type { GameState } from "../state/GameState.js";
import { CountCapabilityModel } from "./CountCapabilityModel.js";

/** Count of Carcassonne — the City of Carcassonne (CO/7) start tile with four districts,
 *  plus the neutral Count figure that gates district scoring and re-deployment. */
export class CountCapability extends Capability<CountCapabilityModel> {
  static readonly QUARTER_ACTION_TILE_ID = "CO/7";
  private static readonly FORBIDDEN_TILES = ["CO/6", "CO/7"];

  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    const count = new Count("count.1");
    state = state.mapNeutralFigures((nf) => nf.setCount(count));

    let quarterPosition: Position | null = null;
    for (const t of state.getPlacedTiles()) {
      if (t._2.getTile().getId() === CountCapability.QUARTER_ACTION_TILE_ID) {
        quarterPosition = t._1;
        break;
      }
    }
    state = this.setModel(state, new CountCapabilityModel(quarterPosition!, null));
    state = new MoveNeutralFigure(
      count as unknown as NeutralFigure<BoardPointer>,
      new FeaturePointer(quarterPosition!, Quarter as never, Location.QUARTER_CASTLE),
    ).apply(state);
    return state;
  }

  override initTile(_state: GameState, tile: Tile, _tileElement: XmlElement): Tile {
    if (CountCapability.QUARTER_ACTION_TILE_ID === tile.getId()) {
      let features = tile.getInitialFeatures();
      for (const loc of Location.QUARTERS) {
        const fp = new FeaturePointer(Position.ZERO, Quarter as never, loc);
        features = features.put(fp, new Quarter(fp) as unknown as Feature);
      }
      return tile.setInitialFeatures(features);
    }
    return tile;
  }

  static isTileForbidden(tile: Tile): boolean {
    return CountCapability.FORBIDDEN_TILES.includes(tile.getId());
  }

  override isMeepleDeploymentAllowed(state: GameState, pos: Position): boolean {
    const pt = state.getPlacedTiles().get(pos).getOrNull();
    return pt === null || !CountCapability.isTileForbidden(pt.getTile());
  }
}

Capability.register(CountCapability);
