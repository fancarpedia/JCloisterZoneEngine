import { HashSet, type Set } from "../../../io/vavr/Set.js";
import type { ReplayableMessage } from "../io/message/ReplayableMessage.js";
import type { PlayerAction } from "./PlayerAction.js";

/** Base for player actions; provides the PlayerAction interface defaults. */
export abstract class AbstractPlayerAction<T> implements PlayerAction<T> {
  protected readonly options: Set<T> | null;

  constructor(options: Set<T> | null) {
    this.options = options;
  }

  getOptions(): Set<T> {
    return this.options as Set<T>;
  }

  isEmpty(): boolean {
    return this.options === null ? true : this.options.isEmpty();
  }

  select(option: T): ReplayableMessage | null {
    return null;
  }

  [Symbol.iterator](): Iterator<T> {
    return (this.options ?? HashSet.empty<T>())[Symbol.iterator]();
  }
}
