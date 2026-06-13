import type { SetupQuery } from "../../game/setup/SetupQuery.js";
import { FeatureModifier } from "./FeatureModifier.js";

/** Integer modifier merged by addition (e.g. pennants count). */
export class IntegerAddModifier extends FeatureModifier<number> {
  constructor(selector: string, enabledBy: SetupQuery | null) {
    super(selector, enabledBy);
  }

  mergeValues(a: number, b: number): number {
    return a + b;
  }

  valueOf(attr: string): number {
    return parseInt(attr, 10);
  }
}
