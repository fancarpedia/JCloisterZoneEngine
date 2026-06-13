import type { SetupQuery } from "../../game/setup/SetupQuery.js";
import { BooleanModifier } from "./BooleanModifier.js";

/** Boolean modifier merged with OR. */
export class BooleanAnyModifier extends BooleanModifier {
  constructor(selector: string, enabledBy: SetupQuery | null) {
    super(selector, enabledBy);
  }

  mergeValues(a: boolean, b: boolean): boolean {
    return a || b;
  }
}
