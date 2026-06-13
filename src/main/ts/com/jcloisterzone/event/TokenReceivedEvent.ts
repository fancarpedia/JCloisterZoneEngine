import type { Player } from "../Player.js";
import type { Position } from "../board/Position.js";
import type { Feature } from "../feature/Feature.js";
import type { Token } from "../game/Token.js";
import type { Vector } from "../../../io/vavr/SeqTypes.js";
import { PlayEvent, type PlayEventMeta } from "./PlayEvent.js";

/** A player received supply tokens (trade goods, gold, ...). */
export class TokenReceivedEvent extends PlayEvent {
  static readonly simpleName = "TokenReceivedEvent";

  private sourceFeature: Feature | null = null;
  private sourcePositions: Vector<Position> | null = null;

  constructor(
    metadata: PlayEventMeta,
    private readonly player: Player,
    private readonly token: Token,
    private readonly count: number,
  ) {
    super(metadata);
  }

  getToken(): Token {
    return this.token;
  }
  getPlayer(): Player {
    return this.player;
  }
  getCount(): number {
    return this.count;
  }
  getSourceFeature(): Feature | null {
    return this.sourceFeature;
  }
  setSourceFeature(sourceFeature: Feature | null): void {
    this.sourceFeature = sourceFeature;
  }
  getSourcePositions(): Vector<Position> | null {
    return this.sourcePositions;
  }
  setSourcePositions(sourcePositions: Vector<Position> | null): void {
    this.sourcePositions = sourcePositions;
  }
}
