import { attributeBoolValue, type XmlElement } from "../../XmlUtils.js";
import type { Feature } from "../../feature/Feature.js";
import { Field } from "../../feature/Field.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

/** Pig Herd (GQ11 promo) — a field tile marked `pig-herd` grants +1 point per scored
 *  city/castle when the field's owner also has a pig on it. Port of PigHerdCapability. */
export class PigHerdCapability extends Capability<void> {
  override initFeature(_state: GameState, _tileId: string, feature: Feature, xml: XmlElement): Feature {
    if (feature instanceof Field && attributeBoolValue(xml, "pig-herd")) {
      return (feature as Field).putModifier(Field.PIG_HERD, 1);
    }
    return feature;
  }
}

Capability.register(PigHerdCapability);
