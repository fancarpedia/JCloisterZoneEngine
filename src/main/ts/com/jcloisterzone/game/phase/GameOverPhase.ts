import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { FinalScoring } from "../../reducers/FinalScoring.js";
import type { GameState } from "../state/GameState.js";
import { Phase } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

/** Terminal phase: clears the turn player and runs final scoring. */
export class GameOverPhase extends Phase {
  static readonly simpleName = "GameOverPhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    state = state.setPlayerActions(null);
    state = state.mapPlayers((ps) => ps.setTurnPlayerIndex(null));
    state = new FinalScoring().apply(state);
    return this.promote(state);
  }
}
