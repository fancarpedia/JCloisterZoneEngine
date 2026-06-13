import type { Position } from "../board/Position.js";
import type { Set } from "../../../io/vavr/Set.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A meteorite d6 roll (combination variant): the impacted `positions`, the die `value`, and a
 *  `type` discriminator (`meteorite-impact.<variant>`). */
export class DiceSixRollEvent extends PlayEvent {
  static readonly simpleName = "DiceSixRollEvent";

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
