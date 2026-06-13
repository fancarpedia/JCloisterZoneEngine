import { HashSet } from "../../../../io/vavr/Set.js";
import { List } from "../../../../io/vavr/SeqTypes.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import { Position } from "../../board/Position.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { Monastery } from "../../feature/Monastery.js";
import type { Scoreable } from "../../feature/Scoreable.js";
import { Follower } from "../../figure/Follower.js";
import type { Meeple } from "../../figure/Meeple.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

type MFp = Tuple2<Meeple, FeaturePointer>;

/** Church (Darmstadt promo): when a church monastery completes, the player(s) with
 *  the most followers around it get a +3 bonus. */
export class ChurchCapability extends Capability<void> {
  static readonly CHURCH_TILES_BONUS = 3;

  override appendFiguresBonusPoints(
    state: GameState,
    bonusPoints: List<ReceivedPoints>,
    feature: Scoreable,
    isFinal: boolean,
  ): List<ReceivedPoints> {
    if (isFinal || !(feature instanceof Monastery)) return bonusPoints;
    const monastery = feature;
    if (!monastery.isChurch(state)) return bonusPoints;

    const cloisterPosition = monastery.getPlace().getPosition();
    let positions = HashSet.ofAll(
      Position.ADJACENT_AND_DIAGONAL.values().map((d) => cloisterPosition.add(d)),
    ).add(cloisterPosition);

    const entries = List.ofAll(state.getDeployedMeeples()).filter(
      (mt) => (mt as MFp)._1 instanceof Follower && positions.contains((mt as MFp)._2.getPosition()),
    ) as List<MFp>;
    const grouped = entries.groupBy((mt) => mt._1.getPlayer());

    const max = grouped
      .values()
      .map((seq) => seq.size())
      .foldLeft(-1, (a, b) => Math.max(a, b));
    const players = grouped.filter((_k, v) => v.size() === max).keySet();

    for (const player of players) {
      const followers = grouped.get(player).get();
      const onTile = followers.find((t) => t._2.getPosition().equals(cloisterPosition)).getOrNull();
      const fp: FeaturePointer = onTile === null ? followers.head()._2 : onTile._2;
      const expr = new PointsExpression(
        "church",
        new ExprItem("church", ChurchCapability.CHURCH_TILES_BONUS),
      );
      bonusPoints = bonusPoints.append(new ReceivedPoints(expr, player, fp)) as List<ReceivedPoints>;
    }
    return bonusPoints;
  }
}

Capability.register(ChurchCapability);
