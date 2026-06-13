import type { List } from "../../../io/vavr/SeqTypes.js";
import type { Player } from "../Player.js";
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

  constructor(feature: Castle, points: PointsExpression, isFinal: boolean) {
    super(feature, isFinal);
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
}
