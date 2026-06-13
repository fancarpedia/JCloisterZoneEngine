import type { Set } from "../../../io/vavr/Set.js";
import type { ReplayableMessage } from "../io/message/ReplayableMessage.js";

/** A set of options a player can choose from (T = Position/Location/FeaturePointer/...). */
export interface PlayerAction<T> extends Iterable<T> {
  getOptions(): Set<T>;
  /** default: getOptions().isEmpty() */
  isEmpty(): boolean;
  /** default: null — a message representing the player's choice of `option`. */
  select(option: T): ReplayableMessage | null;
}
