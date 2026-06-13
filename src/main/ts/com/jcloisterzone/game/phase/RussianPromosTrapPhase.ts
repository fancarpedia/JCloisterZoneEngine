import type { ClassToken } from "../../../../lang/Class.js";
import { ConfirmAction } from "../../action/ConfirmAction.js";
import type { CommitMessage } from "../../io/message/CommitMessage.js";
import { CommitMessage as CommitMessageClass } from "../../io/message/CommitMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { RussianPromosTrapCapability } from "../capability/RussianPromosTrapCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const TRAP_CLS = RussianPromosTrapCapability as unknown as ClassToken<RussianPromosTrapCapability>;

/** After a tile placement, re-traps followers exposed by Vodyanoy / Solovei Razboynik. If the
 *  turn player's own follower is exposed, asks them to confirm before the trapping happens. */
export class RussianPromosTrapPhase extends Phase {
  static readonly simpleName = "RussianPromosTrapPhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    const russianPromos = state.getCapabilities().get(TRAP_CLS) as RussianPromosTrapCapability;
    const exposed = russianPromos.findExposedFollowers(state);
    const player = state.getTurnPlayer()!;

    if (exposed.some((exp) => exp.getFollower().getPlayer() === player)) {
      // own follower exposed → confirm previous action first
      state = state.setPlayerActions(new ActionsState(player, new ConfirmAction(), false));
      return this.promote(state);
    }

    if (exposed.length > 0) {
      state = russianPromos.trapFollowers(state, exposed);
    }
    return this.next(state);
  }

  handleCommit(state: GameState, _msg: CommitMessage): StepResult {
    const russianPromos = state.getCapabilities().get(TRAP_CLS) as RussianPromosTrapCapability;
    state = russianPromos.trapFollowers(state);
    return this.next(state);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(CommitMessageClass, this.handleCommit);
    return m;
  }
}
