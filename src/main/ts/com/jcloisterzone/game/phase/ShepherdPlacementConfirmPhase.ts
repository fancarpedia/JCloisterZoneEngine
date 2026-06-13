import { MeepleDeployed } from "../../event/MeepleDeployed.js";
import { Shepherd } from "../../figure/Shepherd.js";
import { ShepherdPlacementConfirmAction } from "../../action/ShepherdPlacementConfirmAction.js";
import { ShepherdPlacementConfirmMessage } from "../../io/message/ShepherdPlacementConfirmMessage.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

/** Confirms a just-placed shepherd before the flock is resolved. */
export class ShepherdPlacementConfirmPhase extends Phase {
  static readonly simpleName = "ShepherdPlacementConfirmPhase";

  enter(state: GameState): StepResult {
    const shepherdPlaced = !state
      .getCurrentTurnPartEvents()
      .filter((ev) => ev instanceof MeepleDeployed)
      .filter(
        (ev) =>
          (ev as MeepleDeployed).getMeeple() instanceof Shepherd &&
          (ev as MeepleDeployed).getMovedFrom() === null,
      )
      .isEmpty();

    if (!shepherdPlaced) {
      return this.next(state);
    }

    return this.promote(
      state.setPlayerActions(
        new ActionsState(
          state.getTurnPlayer()!,
          new ShepherdPlacementConfirmAction() as unknown as PlayerAction<unknown>,
          false,
        ),
      ),
    );
  }

  handleShepherdPlacementConfirm(state: GameState, _msg: ShepherdPlacementConfirmMessage): StepResult {
    state = this.clearActions(state);
    return this.next(state);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(ShepherdPlacementConfirmMessage, this.handleShepherdPlacementConfirm);
    return m;
  }
}
