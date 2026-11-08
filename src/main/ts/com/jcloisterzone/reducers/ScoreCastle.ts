import type { List } from "../../../io/vavr/SeqTypes.js";
import type { Player } from "../Player.js";
import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { ScoreSourceFeaturePointer } from "../board/pointer/ScoreSourceFeaturePointer.js";
import type { ReceivedPoints } from "../event/ScoreEvent.js";
import type { Feature } from "../feature/Feature.js";
import { ExprItem } from "../event/ExprItem.js";
import { PointsExpression } from "../event/PointsExpression.js";
import type { Castle } from "../feature/Castle.js";
import type { GameState } from "../game/state/GameState.js";
import { ScoreFeature } from "./ScoreFeature.js";

/** Scores a castle: it takes the points of the best completed feature in its
 *  vicinity (marketplace bonuses excluded). Unfinished castles score nothing at
 *  game end and grant no figure bonuses. */
export class ScoreCastle extends ScoreFeature {
  private readonly points: PointsExpression;
  private readonly source: Feature | null;

  /** `source` is the feature the castle took its points from - a completed road or city, or
   *  another castle when one castle cascades into the next. Null at final scoring, where an
   *  unfinished castle scores nothing and so has nothing to attribute. Typed as Feature because
   *  only getPlaces() is needed, and the cascade hands us a Castle rather than a Completable. */
  constructor(feature: Castle, points: PointsExpression, isFinal: boolean, source: Feature | null = null) {
    super(feature, isFinal);
    this.source = source;
    let items: List<ExprItem> = points.getItems();
    for (const item of points.getItems()) {
      if (item.getName().startsWith("marketplace.")) {
        items = items.remove(item) as List<ExprItem>;
      }
    }
    const itemsPoints = items.map((exp) => exp.getPoints()).sum();
    this.points = new PointsExpression("castle", new ExprItem("castle." + points.getName(), itemsPoints));
  }

  protected override addFiguresBonusPoints(state: GameState): GameState {
    if (this.isFinal) {
      // no bonuses for an unfinished castle (it isn't scored at the end)
      return state;
    }
    return super.addFiguresBonusPoints(state);
  }

  protected override computeFeaturePoints(_state: GameState, _player: Player): PointsExpression {
    return this.points;
  }

  override getFeaturePoints(): PointsExpression {
    return this.points;
  }

  /** Name the feature the points came from alongside the castle, so the client can show the
   *  player WHY the castle scored what it did and not just that it did. */
  protected override getSampleSource(
    state: GameState,
    player: Player,
    bonusPoints: List<ReceivedPoints>,
  ): BoardPointer {
    const base = super.getSampleSource(state, player, bonusPoints);
    if (this.source === null) {
      return base;
    }
    const places = this.source.getPlaces();
    if (places.isEmpty()) {
      return base;
    }
    return new ScoreSourceFeaturePointer(base as FeaturePointer, places.head());
  }
}
