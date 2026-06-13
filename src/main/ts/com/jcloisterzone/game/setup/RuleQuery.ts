import { equals } from "../../../../io/vavr/equality.js";
import type { Rule } from "../Rule.js";
import type { GameState } from "../state/GameState.js";
import type { SetupQuery } from "./SetupQuery.js";

/** True when a rule equals the expected value. */
export class RuleQuery implements SetupQuery {
  constructor(
    private readonly rule: Rule,
    private readonly value: unknown,
  ) {}

  apply(state: GameState): boolean {
    const value = state.getRules().get(this.rule).getOrNull();
    return equals(this.value, value);
  }
}
