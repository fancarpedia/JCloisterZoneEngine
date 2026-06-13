import type { ClassToken } from "../../../../lang/Class.js";
import { TilePlacementConfirmAction } from "../../action/TilePlacementConfirmAction.js";
import type { TilePlacementConfirmMessage } from "../../io/message/TilePlacementConfirmMessage.js";
import { TilePlacementConfirmMessage as TilePlacementConfirmMessageClass } from "../../io/message/TilePlacementConfirmMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { MeteoriteCapability } from "../capability/MeteoriteCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const METEORITE_CLS = MeteoriteCapability as unknown as ClassToken<MeteoriteCapability>;

/** After placing a tile, asks the turn player to confirm it (Meteorites). For a crater tile,
 *  the confirm rolls the meteorite-impact die; non-crater tiles skip straight through. */
export class TilePlacementConfirmPhase extends Phase {
  static readonly simpleName = "TilePlacementConfirmPhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    const tile = state.getLastPlaced()!.getTile();
    if (!tile.hasModifier(MeteoriteCapability.CRATER)) {
      return this.next(state);
    }
    return this.promote(
      state.setPlayerActions(new ActionsState(state.getTurnPlayer()!, new TilePlacementConfirmAction(), false)),
    );
  }

  handleTilePlacementConfirm(state: GameState, _msg: TilePlacementConfirmMessage): StepResult {
    if (state.hasCapability(METEORITE_CLS)) {
      state = (state.getCapabilities().get(METEORITE_CLS) as MeteoriteCapability).confirmedTilePlacement(state);
    }
    state = this.clearActions(state);
    return this.next(state);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(TilePlacementConfirmMessageClass, this.handleTilePlacementConfirm);
    return m;
  }
}
