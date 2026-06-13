import type { Tuple2 } from "../../../io/vavr/Tuple.js";
import type { HashMap } from "../../../io/vavr/Map.js";
import type { List } from "../../../io/vavr/SeqTypes.js";
import type { Set } from "../../../io/vavr/Set.js";
import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { ExprItem } from "../event/ExprItem.js";
import type { Follower } from "../figure/Follower.js";
import type { GameState } from "../game/state/GameState.js";
import type { Structure } from "./Structure.js";

/** A feature which can be scored. */
export interface Scoreable extends Structure {
  /** Map value: [power, tie-breaking power]. */
  getPowers(state: GameState): HashMap<Player, Tuple2<number, number>>;
  getOwners(state: GameState): Set<Player>;
  getSampleFollower(state: GameState, player: Player): Follower | null;
  getSampleFollower2(state: GameState, player: Player): Tuple2<Follower, FeaturePointer> | null;
  getLittleBuildingPoints(state: GameState): List<ExprItem>;
}

/** Runtime mirror of Java's `instanceof Scoreable` (TS interfaces are erased) —
 *  duck-typed on the required `getOwners` scoring method. */
export function isInstanceOfScoreable(f: unknown): f is Scoreable {
  return typeof (f as { getOwners?: unknown } | null)?.getOwners === "function";
}
