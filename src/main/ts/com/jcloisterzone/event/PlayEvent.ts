import type { Player } from "../Player.js";
import type { GameState } from "../game/state/GameState.js";

/** Metadata attached to every play event. */
export class PlayEventMeta {
  constructor(
    private readonly time: number,
    private readonly triggeringPlayerIndex: number | null,
  ) {}

  static createWithActivePlayer(state: GameState): PlayEventMeta {
    return PlayEventMeta.createWithPlayer(state.getActivePlayer());
  }

  static createWithoutPlayer(): PlayEventMeta {
    return PlayEventMeta.createWithPlayer(null);
  }

  static createWithPlayer(p: Player | null): PlayEventMeta {
    return new PlayEventMeta(Date.now(), p === null ? null : p.getIndex());
  }

  getTime(): number {
    return this.time;
  }

  getTriggeringPlayerIndex(): number | null {
    return this.triggeringPlayerIndex;
  }
}

/** Ancestor of all in-game events. */
export abstract class PlayEvent {
  /** Nested-class alias for Java's PlayEvent.PlayEventMeta. */
  static readonly PlayEventMeta = PlayEventMeta;

  constructor(private readonly metadata: PlayEventMeta) {}

  getMetadata(): PlayEventMeta {
    return this.metadata;
  }

  toString(): string {
    return (this.constructor as { simpleName?: string }).simpleName ?? this.constructor.name;
  }
}
