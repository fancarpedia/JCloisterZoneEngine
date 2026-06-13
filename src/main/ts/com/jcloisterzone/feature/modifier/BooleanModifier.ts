import type { SetupQuery } from "../../game/setup/SetupQuery.js";
import { FeatureModifier } from "./FeatureModifier.js";

export abstract class BooleanModifier extends FeatureModifier<boolean> {
  constructor(selector: string, enabledBy: SetupQuery | null) {
    super(selector, enabledBy);
  }

  valueOf(attr: string): boolean {
    return attr === "yes" || attr === "true" || attr === "1";
  }
}
