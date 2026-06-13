import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import type { Seq } from "../../../../io/vavr/Seq.js";
import type { ClassToken } from "../../../../lang/Class.js";
import { Location } from "../../board/Location.js";
import type { Position } from "../../board/Position.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { NeutralFigureAction } from "../../action/NeutralFigureAction.js";
import { MeepleDeployed } from "../../event/MeepleDeployed.js";
import { Quarter } from "../../feature/Quarter.js";
import { Count } from "../../figure/neutral/Count.js";
import type { NeutralFigure } from "../../figure/neutral/NeutralFigure.js";
import type { MoveNeutralFigureMessage } from "../../io/message/MoveNeutralFigureMessage.js";
import { MoveNeutralFigureMessage as MoveNeutralFigureMessageClass } from "../../io/message/MoveNeutralFigureMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { MoveNeutralFigure } from "../../reducers/MoveNeutralFigure.js";
import type { Capability } from "../Capability.js";
import { Rule } from "../Rule.js";
import { CountCapability } from "../capability/CountCapability.js";
import type { CountCapabilityModel } from "../capability/CountCapabilityModel.js";
import { FieldCapability } from "../capability/FieldCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const COUNT_CLS = CountCapability as unknown as ClassToken<Capability<CountCapabilityModel>>;

/** Moves the Count to a new district after a turn, per the COUNT_MOVE rule (by-player choice,
 *  clockwise, or follow the last City-of-Carcassonne deployment). */
export class CocCountPhase extends Phase {
  static readonly simpleName = "CocCountPhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    const player = state.getTurnPlayer()!;
    const count = state.getNeutralFigures().getCount()!;
    const quarterPos: Position = state.getCapabilityModel<CountCapabilityModel>(COUNT_CLS).getQuarterPosition();
    const countFp = state.getNeutralFigures().getCountDeployment()!;
    const rule = state.getStringRule(Rule.COUNT_MOVE);

    if (rule === "clockwise") {
      const quarter = countFp.getLocation();
      let nextQuarter: Location;
      if (quarter === Location.QUARTER_CASTLE) nextQuarter = Location.QUARTER_MARKET;
      else if (quarter === Location.QUARTER_MARKET) nextQuarter = Location.QUARTER_BLACKSMITH;
      else if (quarter === Location.QUARTER_BLACKSMITH) nextQuarter = Location.QUARTER_CATHEDRAL;
      else nextQuarter = Location.QUARTER_CASTLE;
      state = new MoveNeutralFigure(
        count as unknown as NeutralFigure<BoardPointer>,
        new FeaturePointer(quarterPos, Quarter as never, nextQuarter),
        player,
      ).apply(state);
      return this.next(state);
    }

    if (rule === "follow-meeple") {
      const cocDeployment = state
        .getEvents()
        .findLast(
          (ev) => ev instanceof MeepleDeployed && ev.getLocation()!.isCityOfCarcassonneQuarter(),
        )
        .get() as MeepleDeployed;
      state = new MoveNeutralFigure(
        count as unknown as NeutralFigure<BoardPointer>,
        new FeaturePointer(quarterPos, Quarter as never, cocDeployment.getLocation()!),
        player,
      ).apply(state);
      return this.next(state);
    }

    // by-player: offer all quarters except the current one (and market only with fields)
    let quarters: Seq<Location> = Location.QUARTERS.filter((loc) => loc !== countFp.getLocation());
    if (!state.getCapabilities().contains(FieldCapability as never)) {
      quarters = quarters.filter((loc) => loc !== Location.QUARTER_MARKET);
    }
    let options: Set<FeaturePointer> = HashSet.empty<FeaturePointer>();
    for (const loc of quarters) options = options.add(new FeaturePointer(quarterPos, Quarter as never, loc));
    const action = new NeutralFigureAction(count as unknown as NeutralFigure<FeaturePointer>, options);

    state = state.setPlayerActions(new ActionsState(player, action, true));
    return this.promote(state);
  }

  handleMoveNeutralFigure(state: GameState, msg: MoveNeutralFigureMessage): StepResult {
    const fig = state.getNeutralFigures().getById(msg.getFigureId()!);
    if (fig instanceof Count) {
      const fp = msg.getTo() as FeaturePointer;
      state = new MoveNeutralFigure(
        fig as unknown as NeutralFigure<BoardPointer>,
        fp,
        state.getActivePlayer(),
      ).apply(state);
      state = this.clearActions(state);
      return this.next(state);
    }
    throw new Error("Illegal neutral figure move");
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(MoveNeutralFigureMessageClass, this.handleMoveNeutralFigure);
    return m;
  }
}
