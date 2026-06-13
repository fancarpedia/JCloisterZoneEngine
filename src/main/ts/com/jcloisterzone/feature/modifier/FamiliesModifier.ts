import type { SetupQuery } from "../../game/setup/SetupQuery.js";
import { FeatureModifier } from "./FeatureModifier.js";

/** Family-colour modifier (Family Feud; also written by Gambler's Luck dice).
 *  Merging: "grey" yields to the other colour, "both" wins, differing colours conflict. */
export class FamiliesModifier extends FeatureModifier<string> {
  static readonly CONFLICT = "";

  constructor(selector: string, enabledBy: SetupQuery | null) {
    super(selector, enabledBy);
  }

  mergeValues(a: string | null, b: string | null): string {
    if (a === null) return b as string;
    if (b === null) return a;
    if (a === "grey") return b; // Gambler's Luck
    if (b === "grey") return a; // Gambler's Luck
    if (a === "both" || b === "both") return "both"; // both colours
    return a === b ? a : FamiliesModifier.CONFLICT;
  }

  valueOf(attr: string): string {
    return attr;
  }
}
