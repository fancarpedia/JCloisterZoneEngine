import type { Map as VMap } from "../../../io/vavr/Map.js";
import type { Set } from "../../../io/vavr/Set.js";
import type { GameState } from "../game/state/GameState.js";
import type { BooleanModifier } from "./modifier/BooleanModifier.js";
import type { FeatureModifier } from "./modifier/FeatureModifier.js";
import type { Feature } from "./Feature.js";

/**
 * A feature carrying scoring/behaviour modifiers (cathedral, pennant, shrine...).
 * (The GraalVM scripted-scoring method is intentionally omitted.)
 */
export interface ModifiedFeature extends Feature {
  getModifiers(): VMap<FeatureModifier<unknown>, unknown>;
  setModifiers(modifiers: VMap<FeatureModifier<unknown>, unknown>): ModifiedFeature;
  putModifier<T>(modifier: FeatureModifier<T>, value: T): ModifiedFeature;
  hasModifier(state: GameState, modifier: BooleanModifier): boolean;
  getModifier<T>(state: GameState, modifier: FeatureModifier<T>, defaultValue: T): T;
  getScriptedModifiers(state: GameState): Set<FeatureModifier<unknown>>;
  mergeModifiers(otherModifiers: VMap<FeatureModifier<unknown>, unknown>): VMap<FeatureModifier<unknown>, unknown>;
}
