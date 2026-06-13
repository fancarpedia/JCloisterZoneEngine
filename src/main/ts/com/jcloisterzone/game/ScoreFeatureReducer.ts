import type { Set } from "../../../io/vavr/Set.js";
import type { Player } from "../Player.js";
import type { PointsExpression } from "../event/PointsExpression.js";
import type { Scoreable } from "../feature/Scoreable.js";
import type { Reducer } from "../reducers/Reducer.js";

/** A reducer that scores a single feature. */
export interface ScoreFeatureReducer extends Reducer {
  getFeature(): Scoreable;
  getOwners(): Set<Player>;
  getFeaturePoints(): PointsExpression;
  /** Java's getFeaturePoints(Player); renamed to avoid the no-arg/1-arg overload
   *  clash. default: feature points if the player is an owner, else null. */
  getFeaturePointsForPlayer(player: Player): PointsExpression | null;
}
