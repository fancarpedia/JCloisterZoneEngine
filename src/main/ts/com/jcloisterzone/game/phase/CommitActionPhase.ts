import { ConfirmAction } from "../../action/ConfirmAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { CommitMessage } from "../../io/message/CommitMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { ActionsState } from "../state/ActionsState.js";
import { Flag } from "../state/Flag.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { RewindActionContainer } from "./RewindActionContainer.js";
import type { StepResult } from "./StepResult.js";

/** Asks the player to confirm/commit; handles COMMIT. */
export class CommitActionPhase extends Phase {
  static readonly simpleName: string = "CommitActionPhase";

  constructor(
    random: RandomGenerator,
    defaultNext: Phase | null,
    rewindActionContainer: RewindActionContainer | null = null,
  ) {
    super(random, defaultNext, rewindActionContainer);
  }

  enter(state: GameState): StepResult {
    if (state.isCommited()) {
      return this.next(state);
    }
    const player = state.getTurnPlayer()!;
    state = state.setPlayerActions(
      new ActionsState(player, new ConfirmAction() as unknown as PlayerAction<unknown>, false),
    );
    return this.promote(state);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(CommitMessage, this.handleCommit);
    return m;
  }

  handleCommit(state: GameState, msg: CommitMessage): StepResult {
    state = state.addFlag(Flag.WOOD_ACTION_CONFIRMED);
    state = this.clearActions(state);
    return this.next(state);
  }
}
