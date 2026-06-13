import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import type { Set } from "../../../../io/vavr/Set.js";
import type { GameState } from "../../game/state/GameState.js";
import type { BooleanModifier } from "./BooleanModifier.js";
import type { FeatureModifier } from "./FeatureModifier.js";

/**
 * Free-function implementations of the Java {@code ModifiedFeature} default
 * methods (TS interfaces can't carry implementations). Feature classes delegate
 * their interface methods here. Scripted (GraalVM) scoring is omitted.
 */
type ModMap = VMap<FeatureModifier<unknown>, unknown>;

export function getModifier<T>(
  modifiers: ModMap,
  state: GameState,
  modifier: FeatureModifier<T>,
  defaultValue: T,
): T {
  const enabledBy = modifier.getEnabledBy();
  if (enabledBy !== null && !enabledBy.apply(state)) {
    return defaultValue;
  }
  return modifiers.get(modifier as FeatureModifier<unknown>).getOrElse(defaultValue as unknown) as T;
}

export function hasModifier(modifiers: ModMap, state: GameState, modifier: BooleanModifier): boolean {
  return getModifier<boolean>(modifiers, state, modifier, false);
}

export function getScriptedModifiers(modifiers: ModMap, state: GameState): Set<FeatureModifier<unknown>> {
  return modifiers.keySet().filter((mod) => {
    const enabledBy = mod.getEnabledBy();
    return mod.getScoringScript() !== null && (enabledBy === null || enabledBy.apply(state));
  });
}

export function mergeModifierMaps(modifiers: ModMap, otherModifiers: ModMap): ModMap {
  const missingOtherKeys = otherModifiers.keySet().diff(modifiers.keySet());
  const entries: Tuple2<FeatureModifier<unknown>, unknown>[] = [];
  for (const t of modifiers) {
    const modifier = t._1;
    const otherValue = otherModifiers.get(t._1).getOrNull();
    if (otherValue === null) {
      if (!modifier.isExclusive(t._2)) {
        entries.push(t);
      }
    } else {
      const val = modifier.mergeValues(t._2, otherValue);
      if (val !== null) {
        entries.push(t.update2(val));
      }
    }
  }
  for (const mod of missingOtherKeys) {
    const val = otherModifiers.get(mod).get();
    if (!mod.isExclusive(val)) {
      entries.push(new Tuple2(mod, val));
    }
  }
  return HashMap.ofEntries(entries);
}
