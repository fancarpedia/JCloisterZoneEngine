import { Location } from "../../board/Location.js";
import { Position } from "../../board/Position.js";
import type { Tile } from "../../board/Tile.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { FlyingMachine } from "../../feature/FlyingMachine.js";
import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

/** The Flying Machines mini-expansion — adds a FlyingMachine feature (with a direction)
 *  to tiles bearing a {@code <flying-machine>} element. */
export class FlierCapability extends Capability<void> {
  override initTile(_state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    const els = getElementStreamByTagName(tileElement, "flying-machine").toArray();
    if (els.length === 0) return tile;
    if (els.length > 1) throw new Error("multiple <flying-machine> elements");
    const direction = Location.valueOf(els[0].getAttribute("direction"));
    const fp = new FeaturePointer(Position.ZERO, FlyingMachine as never, Location.I);
    return tile.setInitialFeatures(tile.getInitialFeatures().put(fp, new FlyingMachine(fp, direction)));
  }
}

Capability.register(FlierCapability);
