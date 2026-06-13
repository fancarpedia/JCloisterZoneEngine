import { attributeIntValue, type XmlElement } from "../../XmlUtils.js";
import type { PlacementOption } from "../../board/PlacementOption.js";
import type { Tile } from "../../board/Tile.js";
import { City } from "../../feature/City.js";
import type { Feature } from "../../feature/Feature.js";
import { FamiliesModifier } from "../../feature/modifier/FamiliesModifier.js";
import { isInstanceOfStructure } from "../../feature/Structure.js";
import { PlaceTile } from "../../reducers/PlaceTile.js";
import { GameElementQuery } from "../setup/GameElementQuery.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

/** Family Feud: a city with pennant(s) carries a family colour (FAMILY modifier); a tile
 *  placement that would merge cities of two different (non-grey) families is forbidden. */
export class FamiliesCapability extends Capability<void> {
  static readonly FAMILY = new FamiliesModifier("family", new GameElementQuery("families"));

  override initFeature(_state: GameState, _tileId: string, feature: Feature, xml: XmlElement): Feature {
    if (feature instanceof City) {
      if ((attributeIntValue(xml, "pennants", 0) ?? 0) > 0) {
        const family = xml.hasAttribute("family") ? xml.getAttribute("family") : "blue";
        feature = feature.putModifier(FamiliesCapability.FAMILY, family);
      }
    }
    return feature;
  }

  override isTilePlacementAllowed(state: GameState, tile: Tile, placement: PlacementOption): boolean {
    const enabledBy = FamiliesCapability.FAMILY.getEnabledBy();
    // skip testing if FAMILY is not initialised by setup
    if (!(enabledBy !== null && enabledBy.apply(state))) return true;

    const pos = placement.getPosition();
    const rot = placement.getRotation();
    const finalState = new PlaceTile(tile, pos, rot).apply(state);

    const cities: City[] = [];
    for (const t of finalState.getTileFeatures2(pos)) {
      const f = t._2;
      if (!isInstanceOfStructure(f)) continue;
      if (
        f instanceof City &&
        !f.hasModifier(finalState, City.ELIMINATED_PENNANTS) &&
        f.getModifier(finalState, City.PENNANTS, 0) > 0
      ) {
        cities.push(f);
      }
    }

    if (cities.length === 0) return true; // no city with a pennant → allowed

    return !cities.some(
      (city) => city.getModifier(finalState, FamiliesCapability.FAMILY, null) === FamiliesModifier.CONFLICT,
    );
  }
}

Capability.register(FamiliesCapability);
