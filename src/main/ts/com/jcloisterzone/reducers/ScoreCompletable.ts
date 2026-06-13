import type { Player } from "../Player.js";
import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import type { PointsExpression } from "../event/PointsExpression.js";
import type { Completable } from "../feature/Completable.js";
import type { Feature } from "../feature/Feature.js";
import type { NeutralFigure } from "../figure/neutral/NeutralFigure.js";
import type { GameState } from "../game/state/GameState.js";
import { ReturnNeutralFigure } from "./ReturnNeutralFigure.js";
import { ScoreFeature } from "./ScoreFeature.js";

/** Scores a completable feature (city/road/cloister). */
export class ScoreCompletable extends ScoreFeature {
  private points!: PointsExpression;

  constructor(feature: Completable, isFinal: boolean) {
    super(feature, isFinal);
  }

  protected computeFeaturePoints(state: GameState, player: Player): PointsExpression {
    return this.points;
  }

  getFeaturePoints(): PointsExpression {
    return this.points;
  }

  override getFeature(): Completable {
    return super.getFeature() as Completable;
  }

  override apply(state: GameState): GameState {
    this.points = this.getFeature().getPoints(state);
    state = super.apply(state);
    if (!this.isFinal) {
      // a mage/witch on the just-scored feature is returned off the board
      const feat = this.getFeature() as unknown as Feature;
      const mage = state.getNeutralFigures().getMage();
      if (mage !== null && (mage.getFeature(state) as unknown as Feature) === feat) {
        state = new ReturnNeutralFigure(mage as unknown as NeutralFigure<BoardPointer>).apply(state);
      }
      const witch = state.getNeutralFigures().getWitch();
      if (witch !== null && (witch.getFeature(state) as unknown as Feature) === feat) {
        state = new ReturnNeutralFigure(witch as unknown as NeutralFigure<BoardPointer>).apply(state);
      }
    }
    return state;
  }
}
