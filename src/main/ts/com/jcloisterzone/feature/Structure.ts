import type { Tuple2 } from "../../../io/vavr/Tuple.js";
import type { Stream } from "../../../io/vavr/SeqTypes.js";
import type { ClassToken } from "../../../lang/Class.js";
import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Follower } from "../figure/Follower.js";
import type { Meeple } from "../figure/Meeple.js";
import type { Special } from "../figure/Special.js";
import type { Capability } from "../game/Capability.js";
import type { GameState } from "../game/state/GameState.js";
import type { Feature } from "./Feature.js";

/** A feature meeples can be deployed on (includes Field). */
export interface Structure extends Feature {
  getMeeples2(state: GameState): Stream<Tuple2<Meeple, FeaturePointer>>;
  getMeeples(state: GameState): Stream<Meeple>;
  getFollowers2(state: GameState): Stream<Tuple2<Follower, FeaturePointer>>;
  getFollowers(state: GameState): Stream<Follower>;
  getSpecialMeeples2(state: GameState): Stream<Tuple2<Special, FeaturePointer>>;
  getSpecialMeeples(state: GameState): Stream<Special>;
  isOccupied(state: GameState): boolean;
  isOccupiedBy(state: GameState, p: Player): boolean;
  /** Capability required for meeple deployment; null means always deployable. */
  getRequiredCapability(): ClassToken<Capability<unknown>> | null;
}

/** Runtime mirror of Java's `instanceof Structure` (duck-typed: every Structure has
 *  getMeeples2; pure EdgeFeatures — AbbeyEdge/Bush/CityGate — inherit it but override
 *  isInstanceOfStructure() to false). THE single definition. */
export function isInstanceOfStructure(f: unknown): f is Structure {
  const o = f as { getMeeples2?: unknown; isStructure?: () => boolean };
  return typeof o.getMeeples2 === "function" && o.isStructure?.() !== false;
}
