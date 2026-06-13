import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { List } from "../../../../io/vavr/SeqTypes.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import type { ClassToken } from "../../../../lang/Class.js";
import { Location } from "../../board/Location.js";
import { Position } from "../../board/Position.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { City } from "../../feature/City.js";
import { type Completable, isInstanceOfCompletable } from "../../feature/Completable.js";
import { isInstanceOfWagonEligible } from "../capability/trait/WagonEligible.js";
import type { Feature } from "../../feature/Feature.js";
import { Garden } from "../../feature/Garden.js";
import { Monastery } from "../../feature/Monastery.js";
import { River } from "../../feature/River.js";
import { Road } from "../../feature/Road.js";
import type { Structure } from "../../feature/Structure.js";
import { DeploymentCheckResult } from "../../figure/DeploymentCheckResult.js";
import { Wagon } from "../../figure/Wagon.js";
import { MonasteriesCapability } from "../capability/MonasteriesCapability.js";
import { Rule } from "../Rule.js";
import { ConfirmAction } from "../../action/ConfirmAction.js";
import { MeepleAction } from "../../action/MeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { MeepleReturned } from "../../event/MeepleReturned.js";
import { CommitMessage } from "../../io/message/CommitMessage.js";
import { RussianPromosTrapCapability } from "../capability/RussianPromosTrapCapability.js";
import { DeployMeepleMessage } from "../../io/message/DeployMeepleMessage.js";
import type { PassMessage } from "../../io/message/PassMessage.js";
import { DeployMeeple } from "../../reducers/DeployMeeple.js";
import type { Capability } from "../Capability.js";
import { WagonCapability, type WagonModel } from "../capability/WagonCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const WAGON_CLS = WagonCapability as unknown as ClassToken<Capability<WagonModel>>;
const RUSSIAN_PROMOS_CLS = RussianPromosTrapCapability as unknown as ClassToken<RussianPromosTrapCapability>;


/** After scoring, lets each scored wagon's owner move it to an adjacent open feature. */
export class WagonPhase extends Phase {
  static readonly simpleName = "WagonPhase";

  enter(state: GameState): StepResult {
    let model = state.getCapabilityModel<WagonModel>(WAGON_CLS);
    while (!model.isEmpty()) {
      const [item, rest] = model.dequeue();
      model = rest;
      state = state.setCapabilityModel<WagonModel>(WAGON_CLS, model);
      const wagon = item._1;
      const sourceFp = item._2;
      const feature = state.getFeature(sourceFp);
      if (!isInstanceOfWagonEligible(feature)) continue;

      const options = this.computeOptions(state, feature as unknown as Completable, sourceFp, wagon);
      if (options.isEmpty()) continue;

      const returnedEvent = state
        .getEvents()
        .findLast((ev) => ev instanceof MeepleReturned && (ev as MeepleReturned).getMeeple() === wagon)
        .getOrNull() as MeepleReturned | null;
      const origin = returnedEvent === null ? null : returnedEvent.getFrom();
      const action = new MeepleAction(wagon, options, origin);
      state = state.setPlayerActions(
        new ActionsState(wagon.getPlayer(), action as unknown as PlayerAction<unknown>, true),
      );
      return this.promote(state);
    }
    return this.next(state);
  }

  /** Candidate (fp, feature) pairs to consider, per the WAGON_MOVE rule.
   *  C1 = only features neighbouring the scored feature; otherwise (C2/default) all
   *  structures on the source tile and its adjacent+diagonal tiles. */
  private getAdjacentFeatures(
    state: GameState,
    feature: Completable,
    source: FeaturePointer,
  ): Array<Tuple2<FeaturePointer, Structure>> {
    if (state.getStringRule(Rule.WAGON_MOVE) === "C1") {
      return (feature as unknown as { getNeighboring(): Set<FeaturePointer> })
        .getNeighboring()
        .toArray()
        .map((fp) => new Tuple2(fp, state.getFeature(fp) as unknown as Structure));
    }
    const sourcePos = source.getPosition();
    const positions: Position[] = Position.ADJACENT_AND_DIAGONAL.values()
      .toArray()
      .map((p) => sourcePos.add(p));
    positions.push(sourcePos);
    const out: Array<Tuple2<FeaturePointer, Structure>> = [];
    for (const pos of positions) {
      for (const t of state.getTileFeatures2(pos)) {
        out.push(new Tuple2(t._1, t._2 as unknown as Structure));
      }
    }
    return out;
  }

  /** Open completable features the wagon may move to (per WAGON_MOVE rule). */
  private computeOptions(
    state: GameState,
    feature: Completable,
    source: FeaturePointer,
    wagon: Wagon,
  ): Set<FeaturePointer> {
    const result: FeaturePointer[] = [];
    for (const t of this.getAdjacentFeatures(state, feature, source)) {
      const fp = t._1;
      const f = t._2;
      if (!isInstanceOfCompletable(f)) continue; // eg f == null
      const nei = f as unknown as Completable & Structure;
      if (wagon.isDeploymentAllowed(state, fp, f as unknown as Structure) !== DeploymentCheckResult.OK) continue;
      if (nei.isCompleted(state)) continue;
      if (f instanceof Monastery) {
        if (!f.getMeeplesIncludingMonastery(state).isEmpty()) continue;
      } else if (nei.isOccupied(state)) {
        // a labyrinth road divided by centres may still hold a wagon in an empty segment
        // (unless this very tile is the labyrinth centre, where the normal rule applies)
        let labyrinthFreeSegment = false;
        if (f instanceof Road && f.isLabyrinth(state)) {
          const initialPart = state.getPlacedTile(fp.getPosition())!.getInitialFeaturePartOf(fp.getLocation()!);
          const initial = initialPart === null ? null : (initialPart._2 as Road);
          if (initial !== null && !initial.isLabyrinth(state)) {
            const segment = f.findSegmentBorderedBy(state, fp, (sfp) => {
              const ip = state.getPlacedTile(sfp.getPosition())!.getInitialFeaturePartOf(sfp.getLocation()!);
              return ip !== null && (ip._2 as Road).isLabyrinth(state);
            });
            const segSet = HashSet.ofAll(segment);
            labyrinthFreeSegment = state.getDeployedMeeples().find((x) => segSet.contains(x._2)).isEmpty();
          }
        }
        if (!labyrinthFreeSegment) continue;
      }

      // expand: a special monastery also offers the abbot slot
      const candidates: FeaturePointer[] = [fp];
      if (
        f instanceof Monastery &&
        f.isSpecialMonastery(state) &&
        state.hasCapability(MonasteriesCapability as unknown as ClassToken<never>)
      ) {
        candidates.push(new FeaturePointer(fp.getPosition(), Monastery as never, Location.AS_ABBOT));
      }

      for (const cfp of candidates) {
        let allowed = true;
        for (const cap of state.getCapabilities().toSeq()) {
          if (!cap.isMeepleDeploymentAllowed(state, cfp.getPosition())) {
            allowed = false;
            break;
          }
        }
        if (allowed) result.push(cfp);
      }
    }
    return HashSet.ofAll(result);
  }

  handleDeployMeeple(state: GameState, msg: DeployMeepleMessage): StepResult {
    const fp = msg.getPointer()!;
    const player = state.getActivePlayer()!;
    const m = player.getMeepleFromSupply(state, msg.getMeepleId()!);
    if (!(m instanceof Wagon)) throw new Error("Invalid follower");

    state = new DeployMeeple(m, fp).apply(state);

    const model = state.getCapabilityModel<WagonModel>(WAGON_CLS);
    if (model.find((t) => t._1.getPlayer().equals(player)).isEmpty()) {
      // no more wagons for this player → confirm
      return this.promote(
        state.setPlayerActions(new ActionsState(player, new ConfirmAction() as unknown as PlayerAction<unknown>, false)),
      );
    }
    state = this.clearActions(state);
    return this.enter(state);
  }

  override handlePass(state: GameState, _msg: PassMessage): StepResult {
    if (!state.getPlayerActions()!.isPassAllowed()) {
      throw new Error("Pass is not allowed");
    }
    state = this.clearActions(state);
    return this.enter(state);
  }

  handleCommit(state: GameState, _msg: CommitMessage): StepResult {
    const russianPromos = state.getCapabilities().get(RUSSIAN_PROMOS_CLS) as RussianPromosTrapCapability | null;
    if (russianPromos !== null) {
      state = russianPromos.trapFollowers(state);
    }
    state = this.clearActions(state);
    return this.enter(state);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(DeployMeepleMessage, this.handleDeployMeeple);
    m.set(CommitMessage, this.handleCommit);
    return m;
  }
}
