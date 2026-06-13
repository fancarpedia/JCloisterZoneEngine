import type { Player } from "../Player.js";
import type { PointsExpression } from "../event/PointsExpression.js";
import type { Field } from "../feature/Field.js";
import type { GameState } from "../game/state/GameState.js";
import { ScoreField } from "./ScoreField.js";

/** Scores a field that is connected (via the just-placed tile) to a field already
 *  holding a barn — uses the reduced "barn connected" point value. */
export class ScoreFieldWhenBarnIsConnected extends ScoreField {
  constructor(feature: Field) {
    super(feature, false);
  }

  protected override computeFeaturePoints(state: GameState, player: Player): PointsExpression {
    const expr = this.getFeature().getPointsWhenBarnIsConnected(state, player);
    this.playerPoints = this.playerPoints.put(player, expr);
    return expr;
  }
}
