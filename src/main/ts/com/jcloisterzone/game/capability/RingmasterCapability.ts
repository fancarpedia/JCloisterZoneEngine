import { List } from "../../../../io/vavr/SeqTypes.js";
import type { Seq } from "../../../../io/vavr/Seq.js";
import type { Position } from "../../board/Position.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { Acrobats } from "../../feature/Acrobats.js";
import { Castle } from "../../feature/Castle.js";
import { Circus } from "../../feature/Circus.js";
import type { Feature } from "../../feature/Feature.js";
import type { Scoreable } from "../../feature/Scoreable.js";
import { Vodyanoy } from "../../feature/Vodyanoy.js";
import { Ringmaster } from "../../figure/Ringmaster.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

const RINGMASTER_BONUS = 2;

/** Ringmaster (Under the Big Top): a follower that, when its feature scores, earns +2 per
 *  adjacent (and on-tile) circus and acrobats space. */
export class RingmasterCapability extends Capability<void> {
  override appendFiguresBonusPoints(
    state: GameState,
    bonusPoints: List<ReceivedPoints>,
    feature: Scoreable,
    _isFinal: boolean,
  ): List<ReceivedPoints> {
    if (feature instanceof Castle || feature instanceof Vodyanoy) {
      return bonusPoints;
    }
    for (const t of feature.getFollowers2(state).filter((x) => x._1 instanceof Ringmaster)) {
      const meeple = t._1;
      const fp = t._2;
      const features = this.getNeighbouringFeatures(state, fp.getPosition());
      const circusCount = features.filter((f) => f instanceof Circus).length();
      const acrobatsCount = features.filter((f) => f instanceof Acrobats).length();
      const exprItems: ExprItem[] = [];
      if (circusCount > 0) {
        exprItems.push(new ExprItem(circusCount, "circus", circusCount * RINGMASTER_BONUS));
      }
      if (acrobatsCount > 0) {
        exprItems.push(new ExprItem(acrobatsCount, "acrobats", acrobatsCount * RINGMASTER_BONUS));
      }
      if (exprItems.length > 0) {
        const expr = new PointsExpression("ringmaster", List.ofAll(exprItems));
        bonusPoints = bonusPoints.append(
          new ReceivedPoints(expr, meeple.getPlayer(), fp),
        ) as List<ReceivedPoints>;
      }
    }
    return bonusPoints;
  }

  private getNeighbouringFeatures(state: GameState, pos: Position): Seq<Feature> {
    return state
      .getAdjacentAndDiagonalTiles(pos)
      .append(state.getPlacedTile(pos)!)
      .flatMap((t) => t.getTile().getInitialFeatures().values()) as Seq<Feature>;
  }
}

Capability.register(RingmasterCapability);
