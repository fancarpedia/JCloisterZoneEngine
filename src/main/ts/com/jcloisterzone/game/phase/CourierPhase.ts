import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { Position } from "../../board/Position.js";
import { Location } from "../../board/Location.js";
import { CastleCreated } from "../../event/CastleCreated.js";
import { MeepleDeployed } from "../../event/MeepleDeployed.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { Castle } from "../../feature/Castle.js";
import { City } from "../../feature/City.js";
import { type Completable, isInstanceOfCompletable } from "../../feature/Completable.js";
import type { Feature } from "../../feature/Feature.js";
import { Garden } from "../../feature/Garden.js";
import { Monastery } from "../../feature/Monastery.js";
import { River } from "../../feature/River.js";
import { Road } from "../../feature/Road.js";
import { YagaHut } from "../../feature/YagaHut.js";
import { Follower } from "../../figure/Follower.js";
import type { Meeple } from "../../figure/Meeple.js";
import type { NeutralFigure } from "../../figure/neutral/NeutralFigure.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import { MoveNeutralFigure } from "../../reducers/MoveNeutralFigure.js";
import type { GameState } from "../state/GameState.js";
import { Phase } from "./Phase.js";
import type { StepResult } from "./StepResult.js";


/** The Courier walks to a follower deployed in its row/column this turn and scores that
 *  follower's neighbouring completed features for the courier owner. */
export class CourierPhase extends Phase {
  static readonly simpleName = "CourierPhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    const fpCourier = state.getNeutralFigures().getCourierDeployment();
    if (fpCourier === null || fpCourier.getPosition() === null) {
      return this.next(state);
    }

    const restrictedQuarters = [
      Location.QUARTER_CASTLE,
      Location.QUARTER_MARKET,
      Location.QUARTER_BLACKSMITH,
      Location.QUARTER_CATHEDRAL,
    ];
    const deployedThisTurn: MeepleDeployed[] = [];
    let castleCreatedThisTurn = false;
    for (const ev of state.getCurrentTurnPartEvents()) {
      if (ev instanceof CastleCreated) castleCreatedThisTurn = true;
      if (
        ev instanceof MeepleDeployed &&
        ev.getMeeple() instanceof Follower &&
        !restrictedQuarters.includes(ev.getLocation()!)
      )
        deployedThisTurn.push(ev);
    }

    // meeples that moved into a castle this turn and are still its lord — keep the
    // RE-EMITTED castle event (its pointer is the Castle, not the original City)
    const castleEvents: MeepleDeployed[] = castleCreatedThisTurn
      ? deployedThisTurn.filter((ev) => {
          const cur = state.getDeployedMeeples().get(ev.getMeeple()).getOrNull();
          return (
            ev.getMovedFrom() !== null &&
            ev.getPointer().asFeaturePointer().getFeature() === (Castle as never) &&
            cur !== null &&
            cur.equals(ev.getPointer().asFeaturePointer())
          );
        })
      : [];

    let meepleForCourier: MeepleDeployed | null = null;
    for (const ev of deployedThisTurn) {
      const m = ev.getMeeple();
      const currentFp = state.getDeployedMeeples().get(m).getOrNull();
      if (currentFp === null) continue;
      if (!this.meepleOrthogonallyAlignedToCourier(state, currentFp, fpCourier)) continue;
      if (currentFp.equals(ev.getPointer().asFeaturePointer())) {
        meepleForCourier = ev;
        break;
      }
      // promoted to castle lord this turn → use the castle event (Castle pointer)
      const castleEv = castleEvents.find((cev) => cev.getMeeple().equals(m));
      if (castleEv !== undefined) {
        meepleForCourier = castleEv;
        break;
      }
    }

    if (meepleForCourier === null) {
      return this.next(state);
    }

    const targetFp = meepleForCourier.getPointer().asFeaturePointer();
    state = new MoveNeutralFigure(
      state.getNeutralFigures().getCourier() as unknown as NeutralFigure<BoardPointer>,
      meepleForCourier.getPointer(),
    ).apply(state);

    const pos = targetFp.getPosition();
    const courierFeature = state.getFeature(targetFp);
    const owner = meepleForCourier.getMeeple().getPlayer();

    // affected: occupied completables near the courier's new feature (deduped by feature)
    const affected: Array<[Meeple, FeaturePointer]> = [];
    const seenFeatures = new globalThis.Set<Feature>();
    for (const t of state.getDeployedMeeples()) {
      const m = t._1;
      const fp = t._2;
      if (!(m instanceof Follower)) continue;
      const f = state.getFeature(fp);
      if (f === null || !isInstanceOfCompletable(f)) continue;
      if (f instanceof Monastery && f.isSpecialMonastery(state)) continue;
      const mpos = fp.getPosition();
      let inRange: boolean;
      if (courierFeature instanceof Castle) {
        inRange = courierFeature.getVicinity().contains(mpos);
      } else {
        inRange = Math.abs(pos.x - mpos.x) <= 1 && Math.abs(pos.y - mpos.y) <= 1;
      }
      if (!inRange) continue;
      if (seenFeatures.has(f)) continue;
      seenFeatures.add(f);
      affected.push([m, fp]);
    }

    for (const [m, fp] of affected) {
      const feature = state.getFeature(fp) as unknown as Completable;
      const expr = feature.getPoints(state);
      const points = new ReceivedPoints(
        new PointsExpression("courier." + expr.getName(), expr.getItems()),
        owner,
        m.getDeployment(state),
      );
      state = new AddPoints(points, false).apply(state);
    }

    return this.next(state);
  }

  private featurePositions(state: GameState, fp: FeaturePointer): Set<Position> {
    const feature = state.getFeature(fp);
    if (feature instanceof Castle) {
      let s: Set<Position> = HashSet.empty<Position>();
      for (const p of feature.getPlaces()) s = s.add(p.getPosition());
      return s;
    }
    return HashSet.of(fp.getPosition());
  }

  private meepleOrthogonallyAlignedToCourier(
    state: GameState,
    meepleFp: FeaturePointer,
    courierFp: FeaturePointer,
  ): boolean {
    const meeplePos = this.featurePositions(state, meepleFp);
    const courierPos = this.featurePositions(state, courierFp);
    return meeplePos.exists((mp) => courierPos.exists((cp) => mp.x === cp.x || mp.y === cp.y));
  }
}
