import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import type { SetupQuery } from "../../game/setup/SetupQuery.js";
import { FeatureModifier } from "./FeatureModifier.js";

/** Modifier merging string→int multisets by summing counts (e.g. flowers). */
export class MultisetStringIntegerAddModifier extends FeatureModifier<VMap<string, number>> {
  constructor(selector: string, enabledBy: SetupQuery | null) {
    super(selector, enabledBy);
  }

  mergeValues(a: VMap<string, number>, b: VMap<string, number>): VMap<string, number> {
    if (a === null) return b;
    if (b === null) return a;
    return a.merge(b, (x, y) => x + y);
  }

  valueOf(attr: string): VMap<string, number> {
    if (attr === null || attr.trim() === "") {
      return HashMap.empty<string, number>();
    }
    let result: VMap<string, number> = HashMap.empty<string, number>();
    for (const token of attr.split(/\s+/)) {
      result = result.put(token, result.get(token).getOrElse(0) + 1);
    }
    return result;
  }
}
