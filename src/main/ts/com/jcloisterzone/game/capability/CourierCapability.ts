import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import { Location } from "../../board/Location.js";
import { Position } from "../../board/Position.js";
import type { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { CourierLetter } from "../../feature/CourierLetter.js";
import type { Feature } from "../../feature/Feature.js";
import { Courier } from "../../figure/neutral/Courier.js";
import type { NeutralFigure } from "../../figure/neutral/NeutralFigure.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { MoveNeutralFigure } from "../../reducers/MoveNeutralFigure.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";
import type { PlacedTile } from "../state/PlacedTile.js";

/** The Courier (fan expansion) — a courier-letter tile summons the neutral courier; each turn
 *  the courier walks to a follower deployed in its row/column and scores that follower's
 *  neighbouring completed features for its owner. */
export class CourierCapability extends Capability<void> {
  static readonly COURIER_LETTER = new TileModifier("CourierLetter");

  override initTile(_state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (!getElementStreamByTagName(tileElement, "courier-letter").isEmpty()) {
      tile = tile.addTileModifier(CourierCapability.COURIER_LETTER);
      tile = tile.setInitialFeatures(
        tile
          .getInitialFeatures()
          .put(new FeaturePointer(Position.ZERO, CourierLetter as never, Location.I), new CourierLetter() as unknown as Feature),
      );
    }
    return tile;
  }

  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    return state.mapNeutralFigures((nf) => nf.setCourier(new Courier("courier.1")));
  }

  override onTilePlaced(state: GameState, pt: PlacedTile): GameState {
    if (pt.getTile().hasModifier(CourierCapability.COURIER_LETTER)) {
      const fp = pt
        .getTile()
        .getInitialFeatures()
        .filterValues((v) => v instanceof CourierLetter)
        .keySet()
        .head();
      state = new MoveNeutralFigure(
        state.getNeutralFigures().getCourier() as unknown as NeutralFigure<BoardPointer>,
        fp.setPosition(pt.getPosition()),
      ).apply(state);
    }
    return state;
  }
}

Capability.register(CourierCapability);
