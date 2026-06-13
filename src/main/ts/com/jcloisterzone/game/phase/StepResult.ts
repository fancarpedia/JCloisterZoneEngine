import type { GameState } from "../state/GameState.js";
import type { Phase } from "./Phase.js";

/** The result of a phase step: the next state and the next phase (or null). */
export class StepResult {
  constructor(
    private readonly state: GameState,
    private readonly next: Phase | null,
  ) {}

  getState(): GameState {
    return this.state;
  }

  getNext(): Phase | null {
    return this.next;
  }
}
