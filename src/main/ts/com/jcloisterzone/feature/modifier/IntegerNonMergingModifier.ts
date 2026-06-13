import type { SetupQuery } from "../../game/setup/SetupQuery.js";
import { FeatureModifier } from "./FeatureModifier.js";

/** Integer modifier stripped (null) on merge. */
export class IntegerNonMergingModifier extends FeatureModifier<number> {
  constructor(selector: string, enabledBy: SetupQuery | null) {
    super(selector, enabledBy);
  }

  mergeValues(a: number, b: number): number | null {
    return null; // strip it after merge
  }

  valueOf(attr: string): number {
    return parseInt(attr, 10);
  }
}
