import { AbstractMessage } from "./AbstractMessage.js";
import type { RandomChangingMessage } from "./RandomChangingMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** FLOCK_EXPAND_OR_SCORE — shepherd owner decides to grow the flock or cash it in. */
export class FlockMessage extends AbstractMessage implements ReplayableMessage, RandomChangingMessage {
  static readonly command = "FLOCK_EXPAND_OR_SCORE";

  private value: FlockMessage.FlockOption | null;
  private random: number | null = null;

  constructor(value: FlockMessage.FlockOption | null = null) {
    super();
    this.value = value;
  }

  getValue(): FlockMessage.FlockOption | null {
    return this.value;
  }
  setValue(value: FlockMessage.FlockOption | null): void {
    this.value = value;
  }
  getRandom(): number | null {
    return this.random;
  }
  setRandom(random: number | null): void {
    this.random = random;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FlockMessage {
  export type FlockOption = "EXPAND" | "SCORE";
  export const FlockOption = { EXPAND: "EXPAND", SCORE: "SCORE" } as const;
}
