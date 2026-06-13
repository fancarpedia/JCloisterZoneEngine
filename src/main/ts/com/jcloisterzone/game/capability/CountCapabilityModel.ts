import type { Set } from "../../../../io/vavr/Set.js";
import type { Player } from "../../Player.js";
import type { Position } from "../../board/Position.js";

/** Model of the Count capability: the CO/7 tile position and the players who have passed
 *  their final-scoring district turn. */
export class CountCapabilityModel {
  constructor(
    /** position of the CO/7 tile */
    private readonly quarterPosition: Position,
    /** players who passed their (final scoring) turn */
    private readonly finalScoringPass: Set<Player> | null,
  ) {}

  getQuarterPosition(): Position {
    return this.quarterPosition;
  }

  getFinalScoringPass(): Set<Player> | null {
    return this.finalScoringPass;
  }

  setFinalScoringPass(value: Set<Player> | null): CountCapabilityModel {
    return new CountCapabilityModel(this.quarterPosition, value);
  }
}
