import type { ClassToken } from "../../../../lang/Class.js";
import type { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import { City } from "../../feature/City.js";
import type { Feature } from "../../feature/Feature.js";
import { Field } from "../../feature/Field.js";
import { Road } from "../../feature/Road.js";
import type { CornCircleRemoveOrDeployMessage } from "../../io/message/CornCircleRemoveOrDeployMessage.js";
import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import { Capability } from "../Capability.js";
import { FieldCapability } from "./FieldCapability.js";
import { FishermenCapability } from "./FishermenCapability.js";
import type { GameState } from "../state/GameState.js";

/** A tile-modifier marking a corn circle of a given feature type. */
export class CornCircleModifier extends TileModifier {
  constructor(readonly featureType: ClassToken<Feature>) {
    super("CornCircle" + (featureType as { simpleName?: string }).simpleName);
  }

  getFeatureType(): ClassToken<Feature> {
    return this.featureType;
  }
}

const CORN_CIRCLE_ROAD = new CornCircleModifier(Road as unknown as ClassToken<Feature>);
const CORN_CIRCLE_CITY = new CornCircleModifier(City as unknown as ClassToken<Feature>);
const CORN_CIRCLE_FIELD = new CornCircleModifier(Field as unknown as ClassToken<Feature>);

/** Crop Circles — a corn-circle tile makes every player deploy or remove a follower
 *  (of the circle's feature type). Model: the active player's DEPLOY/REMOVE choice. */
export class CornCircleCapability extends Capability<CornCircleRemoveOrDeployMessage.CornCircleOption> {
  override initTile(state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    const els = getElementStreamByTagName(tileElement, "corn-circle").toArray();
    if (els.length === 0) return tile;
    if (els.length > 1) throw new Error("multiple <corn-circle> elements");
    const type = els[0].getAttribute("type");
    let modifier: CornCircleModifier;
    switch (type) {
      case "Road":
        modifier = CORN_CIRCLE_ROAD;
        break;
      case "City":
        modifier = CORN_CIRCLE_CITY;
        break;
      case "Field":
        // a field circle has no effect without farmers (FieldCapability / Fishermen)
        if (
          !state.hasCapability(FieldCapability as never) &&
          !state.hasCapability(FishermenCapability as never)
        )
          return tile;
        modifier = CORN_CIRCLE_FIELD;
        break;
      default:
        throw new Error("Invalid corn circle type.");
    }
    return tile.addTileModifier(modifier);
  }
}

Capability.register(CornCircleCapability);
