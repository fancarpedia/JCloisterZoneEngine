import { HashMap, type Map as VMap } from "../../../io/vavr/Map.js";
import type { Player } from "../Player.js";
import type { PointsExpression } from "../event/PointsExpression.js";
import type { Field } from "../feature/Field.js";
import type { GameState } from "../game/state/GameState.js";
import { ScoreFeature } from "./ScoreFeature.js";

/** Scores a field (per-owner points from adjoining completed cities). */
export class ScoreField extends ScoreFeature {
  protected playerPoints: VMap<Player, PointsExpression> = HashMap.empty();
  private readonly exprSubtitle: string | null;

  constructor(feature: Field, isFinal: boolean, exprSubtitle: string | null = null) {
    super(feature, isFinal);
    this.exprSubtitle = exprSubtitle;
  }

  protected computeFeaturePoints(state: GameState, player: Player): PointsExpression {
    const value = this.getFeature().getPoints(state, this.exprSubtitle, player);
    this.playerPoints = this.playerPoints.put(player, value);
    return value;
  }

  getFeaturePoints(): PointsExpression {
    throw new Error("Call getFeaturePointsForPlayer(player)");
  }

  override getFeaturePointsForPlayer(player: Player): PointsExpression | null {
    return this.playerPoints.get(player).getOrNull();
  }

  override getFeature(): Field {
    return super.getFeature() as Field;
  }
}
