import type { ClassToken } from "../../../../lang/Class.js";
import { DoubleTurnEvent } from "../../event/DoubleTurnEvent.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { BuilderCapability } from "../capability/BuilderCapability.js";
import { BuilderState } from "../capability/BuilderState.js";
import { Flag } from "../state/Flag.js";
import type { GameState } from "../state/GameState.js";
import { Phase } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const BUILDER_CLS = BuilderCapability as unknown as ClassToken<BuilderCapability>;

/** End of a turn part. With a used builder, repeats the tile-placement part of the turn. */
export class CleanUpTurnPartPhase extends Phase {
  static readonly simpleName = "CleanUpTurnPartPhase";

  private secondPartStartPhase: Phase | null = null;

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  setSecondPartStartPhase(secondPartStartPhase: Phase | null): void {
    this.secondPartStartPhase = secondPartStartPhase;
  }

  enter(state: GameState): StepResult {
    const builderState = state.getCapabilityModel<BuilderState>(BUILDER_CLS as never);
    const builderTakeAnotherTurn = builderState === BuilderState.USED;
    for (const cap of state.getCapabilities().toSeq()) {
      state = cap.onTurnPartCleanUp(state);
    }
    if (!state.getFlags().isEmpty()) {
      state = state.setFlags(
        state
          .getFlags()
          .remove(Flag.PORTAL_USED)
          .remove(Flag.NO_PHANTOM)
          .remove(Flag.FLYING_MACHINE_USED)
          .remove(Flag.ACTION_PHASE_DONE)
          .remove(Flag.PHANTOM_PHASE_DONE)
          .remove(Flag.POST_WOOD_ACTION_STARTED)
          .remove(Flag.WOOD_ACTION_CONFIRMED),
      );
    }
    if (builderTakeAnotherTurn) {
      state = state.appendEvent(new DoubleTurnEvent(PlayEventMeta.createWithoutPlayer()));
      return this.next(state, this.secondPartStartPhase!);
    }
    return this.next(state);
  }
}
