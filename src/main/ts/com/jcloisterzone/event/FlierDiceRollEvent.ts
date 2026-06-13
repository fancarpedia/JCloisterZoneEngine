import type { Position } from "../board/Position.js";
import type { Set } from "../../../io/vavr/Set.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A meteorite d3-style roll (standard/extended variants): the impacted `positions`, the
 *  derived `value`, and a `type` discriminator (`meteorite-impact.<variant>`). */
export class FlierDiceRollEvent extends PlayEvent {
  static readonly simpleName = "FlierDiceRollEvent";

  constructor(
    metadata: PlayEventMeta,
    private readonly positions: Set<Position>,
    private readonly value: number,
    private readonly type: string,
  ) {
    super(metadata);
  }

  getPositions(): Set<Position> {
    return this.positions;
  }
  getValue(): number {
    return this.value;
  }
  getType(): string {
    return this.type;
  }
}
