import type { SetupQuery } from "../../game/setup/SetupQuery.js";
import { BooleanModifier } from "./BooleanModifier.js";

/** Boolean modifier merged with AND; stripped (null) when not set on both. */
export class BooleanAllModifier extends BooleanModifier {
  constructor(selector: string, enabledBy: SetupQuery | null) {
    super(selector, enabledBy);
  }

  override isExclusive(a: boolean): boolean {
    return true;
  }

  mergeValues(a: boolean, b: boolean): boolean | null {
    return a && b ? true : null; // strip modifier if not set on both
  }
}
