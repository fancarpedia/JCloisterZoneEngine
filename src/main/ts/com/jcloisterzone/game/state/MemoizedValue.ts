import type { GameState } from "./GameState.js";

/** Memoizes a derived value keyed by GameState identity (io.vavr Function1). */
export class MemoizedValue<T> {
  private readonly fn: (state: GameState) => T;
  private cachedValue!: T;
  private cachedState: GameState | null = null;

  constructor(fn: (state: GameState) => T) {
    this.fn = fn;
  }

  apply(state: GameState): T {
    if (this.cachedState !== state) {
      this.cachedValue = this.fn(state);
      this.cachedState = state;
    }
    return this.cachedValue;
  }
}
