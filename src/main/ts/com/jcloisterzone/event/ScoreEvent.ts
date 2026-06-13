import { List } from "../../../io/vavr/SeqTypes.js";
import type { Player } from "../Player.js";
import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import { PlayEvent, PlayEventMeta } from "./PlayEvent.js";
import type { PointsExpression } from "./PointsExpression.js";

/** Points awarded to a player from a source. */
export class ReceivedPoints {
  constructor(
    private readonly expression: PointsExpression,
    private readonly player: Player,
    private readonly source: BoardPointer | null,
  ) {}

  getPoints(): number {
    return this.expression.getPoints();
  }

  getExpression(): PointsExpression {
    return this.expression;
  }

  getPlayer(): Player {
    return this.player;
  }

  getSource(): BoardPointer | null {
    return this.source;
  }

  toString(): string {
    return `{${this.expression},${this.player},${this.source}}`;
  }
}

/** A scoring event (one or more {@link ReceivedPoints}). */
export class ScoreEvent extends PlayEvent {
  static readonly simpleName = "ScoreEvent";

  /** Nested-class alias for Java's ScoreEvent.ReceivedPoints. */
  static readonly ReceivedPoints = ReceivedPoints;

  private readonly points: List<ReceivedPoints>;
  private readonly landscapeSource: boolean;
  private readonly final: boolean;

  constructor(points: List<ReceivedPoints> | ReceivedPoints, landscapeSource: boolean, isFinal: boolean) {
    super(PlayEventMeta.createWithoutPlayer());
    this.points = points instanceof List ? points : List.of(points);
    this.landscapeSource = landscapeSource;
    this.final = isFinal;
  }

  getPoints(): List<ReceivedPoints> {
    return this.points;
  }

  isFinal(): boolean {
    return this.final;
  }

  isLandscapeSource(): boolean {
    return this.landscapeSource;
  }
}
