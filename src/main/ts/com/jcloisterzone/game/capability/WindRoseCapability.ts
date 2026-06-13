import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { Location } from "../../board/Location.js";
import type { Position } from "../../board/Position.js";
import { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import type { XmlElement } from "../../XmlUtils.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";
import type { PlacedTile } from "../state/PlacedTile.js";

/** A wind-rose tile tag (which corner/full rose the tile carries). */
export class WindRoseModifier extends TileModifier {
  constructor(private readonly rose: Location) {
    super("WindRose" + rose.toString());
  }
  getRose(): Location {
    return this.rose;
  }
}

/** Wind Rose (Wind Roses mini-expansion): place tiles in the rose's quadrant for +3.
 *  Model = the last placed full (NWSE) rose tile. */
export class WindRoseCapability extends Capability<PlacedTile> {
  static readonly WIND_ROSE_POINTS = 3;

  static readonly ROSES: VMap<Location, WindRoseModifier> = HashMap.of<Location, WindRoseModifier>(
    Location.NWSE,
    new WindRoseModifier(Location.NWSE),
    Location.NW,
    new WindRoseModifier(Location.NW),
    Location.NE,
    new WindRoseModifier(Location.NE),
    Location.SW,
    new WindRoseModifier(Location.SW),
    Location.SE,
    new WindRoseModifier(Location.SE),
  );

  override onTilePlaced(state: GameState, pt: PlacedTile): GameState {
    let rose = pt
      .getTile()
      .getTileModifiers()
      .find((m) => m instanceof WindRoseModifier)
      .map((m) => (m as WindRoseModifier).getRose())
      .getOrNull();
    if (rose === null) return state;

    if (rose === Location.NWSE) {
      return this.setModel(state, pt);
    }
    const ptRose = this.getModel(state);
    rose = rose.rotateCW(ptRose.getRotation());
    if (this.isInProperQuadrant(rose, pt.getPosition(), ptRose.getPosition())) {
      const p = state.getTurnPlayer()!;
      const expr = new PointsExpression(
        "wind-rose",
        new ExprItem("wind-rose", WindRoseCapability.WIND_ROSE_POINTS),
      );
      state = new AddPoints(new ReceivedPoints(expr, p, pt.getPosition()), false).apply(state);
    }
    return state;
  }

  override initTile(state: GameState, tile: Tile, el: XmlElement): Tile {
    if (el.hasAttribute("wind-rose")) {
      const loc = Location.valueOf(el.getAttribute("wind-rose"));
      tile = tile.addTileModifier(
        WindRoseCapability.ROSES.get(loc).getOrElseThrow(() => new Error("IllegalArgument")),
      );
    }
    return tile;
  }

  private isInProperQuadrant(rose: Location, pos: Position, rosePosition: Position): boolean {
    if (rose === Location.NW) return pos.x <= rosePosition.x && pos.y <= rosePosition.y;
    if (rose === Location.NE) return pos.x >= rosePosition.x && pos.y <= rosePosition.y;
    if (rose === Location.SW) return pos.x <= rosePosition.x && pos.y >= rosePosition.y;
    if (rose === Location.SE) return pos.x >= rosePosition.x && pos.y >= rosePosition.y;
    throw new Error("Wrong rose argument");
  }
}

Capability.register(WindRoseCapability);
