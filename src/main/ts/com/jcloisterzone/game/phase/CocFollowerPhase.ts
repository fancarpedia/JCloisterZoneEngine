import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { Vector } from "../../../../io/vavr/SeqTypes.js";
import type { ClassToken } from "../../../../lang/Class.js";
import { Location } from "../../board/Location.js";
import type { Position } from "../../board/Position.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { MeepleAction } from "../../action/MeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { ScoreEvent } from "../../event/ScoreEvent.js";
import type { Quarter } from "../../feature/Quarter.js";
import { DeploymentCheckResult } from "../../figure/DeploymentCheckResult.js";
import type { Meeple } from "../../figure/Meeple.js";
import { BigFollower } from "../../figure/BigFollower.js";
import { Mayor } from "../../figure/Mayor.js";
import { Phantom } from "../../figure/Phantom.js";
import { Ringmaster } from "../../figure/Ringmaster.js";
import { SmallFollower } from "../../figure/SmallFollower.js";
import { Wagon } from "../../figure/Wagon.js";
import type { DeployMeepleMessage } from "../../io/message/DeployMeepleMessage.js";
import { DeployMeepleMessage as DeployMeepleMessageClass } from "../../io/message/DeployMeepleMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { DeployMeeple } from "../../reducers/DeployMeeple.js";
import { Capability } from "../Capability.js";
import { CountCapability } from "../capability/CountCapability.js";
import type { CountCapabilityModel } from "../capability/CountCapabilityModel.js";
import { FieldCapability } from "../capability/FieldCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { CocCountPhase } from "./CocCountPhase.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const COUNT_CLS = CountCapability as unknown as ClassToken<Capability<CountCapabilityModel>>;

const MEEPLE_TYPES: Vector<ClassToken<Meeple>> = Vector.of(
  SmallFollower as unknown as ClassToken<Meeple>,
  BigFollower as unknown as ClassToken<Meeple>,
  Phantom as unknown as ClassToken<Meeple>,
  Wagon as unknown as ClassToken<Meeple>,
  Mayor as unknown as ClassToken<Meeple>,
  Ringmaster as unknown as ClassToken<Meeple>,
);

/** If this turn's scoring let an opponent score but not the turn player, the turn player may
 *  deploy a follower from supply onto a city district (then the Count moves). */
export class CocFollowerPhase extends Phase {
  static readonly simpleName = "CocFollowerPhase";

  private readonly cocCountPhase: CocCountPhase;

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
    this.cocCountPhase = new CocCountPhase(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    const player = state.getTurnPlayer()!;
    let didReceived = false;
    let didCauseOpponentScoring = false;
    for (const ev of state.getCurrentTurnPartEvents()) {
      if (!(ev instanceof ScoreEvent) || !ev.isLandscapeSource()) continue;
      for (const rp of ev.getPoints()) {
        if (rp.getPoints() === 0) continue;
        if (rp.getPlayer().equals(player)) didReceived = true;
        else didCauseOpponentScoring = true;
      }
    }

    if (didReceived || !didCauseOpponentScoring) {
      return this.next(state);
    }

    const quarterPos: Position = state.getCapabilityModel<CountCapabilityModel>(COUNT_CLS).getQuarterPosition();
    const availMeeples = player.getMeeplesFromSupply(state, MEEPLE_TYPES);
    const fishermen = Capability.tryClassForName("Fishermen");
    const marketAllowed =
      state.getCapabilities().contains(FieldCapability as never) ||
      (fishermen !== null && state.hasCapability(fishermen));

    const quarters = state
      .getTileFeatures2(quarterPos)
      .filter(
        (t) =>
          t._1.getLocation()!.isCityOfCarcassonneQuarter() &&
          (marketAllowed || t._1.getLocation() !== Location.QUARTER_MARKET),
      );

    const _state = state;
    let actions: PlayerAction<unknown>[] = availMeeples.toArray().map((meeple) => {
      let locations: Set<FeaturePointer> = HashSet.empty<FeaturePointer>();
      for (const t of quarters) {
        if (meeple.isDeploymentAllowed(_state, t._1, t._2 as unknown as Quarter) === DeploymentCheckResult.OK) {
          locations = locations.add(t._1);
        }
      }
      return new MeepleAction(meeple, locations) as unknown as PlayerAction<unknown>;
    });
    actions = actions.filter((a) => !a.isEmpty());

    if (actions.length === 0) {
      return this.next(state);
    }

    state = state.setPlayerActions(new ActionsState(player, Vector.ofAll(actions), true));
    return this.promote(state);
  }

  handleDeployMeeple(state: GameState, msg: DeployMeepleMessage): StepResult {
    const fp = msg.getPointer()!;
    const m = state.getActivePlayer()!.getMeepleFromSupply(state, msg.getMeepleId()!);
    if (!fp.getLocation()!.isCityOfCarcassonneQuarter()) {
      throw new Error("Only deploy to the City of Carcassonne is allowed");
    }
    state = new DeployMeeple(m as Meeple, fp).apply(state);
    state = this.clearActions(state);
    return this.next(state, this.cocCountPhase);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(DeployMeepleMessageClass, this.handleDeployMeeple);
    return m;
  }
}
