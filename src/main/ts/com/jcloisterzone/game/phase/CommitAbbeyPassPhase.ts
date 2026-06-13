import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { CommitActionPhase } from "./CommitActionPhase.js";
import type { Phase } from "./Phase.js";

/** When the abbey is passed, a COMMIT follows (to advance the RNG salt) before the
 *  normal tile draw. Behaviour identical to CommitActionPhase; the distinct class
 *  only exists so the phase chain can route through it. */
export class CommitAbbeyPassPhase extends CommitActionPhase {
  static override readonly simpleName: string = "CommitAbbeyPassPhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }
}
