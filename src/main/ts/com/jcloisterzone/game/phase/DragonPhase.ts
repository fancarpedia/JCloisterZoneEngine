import type { Position } from "../../board/Position.js";
import { DragonCapability } from "../capability/DragonCapability.js";
import type { GameState } from "../state/GameState.js";
import { DragonMovePhase } from "./DragonMovePhase.js";
import { Phase } from "./Phase.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import type { RewindActionContainer } from "./RewindActionContainer.js";
import type { StepResult } from "./StepResult.js";

/** After a dragon-trigger tile is placed (and the dragon is on the board), hand off to the
 *  dragon-move phase. */
export class DragonPhase extends Phase {
  static readonly simpleName = "DragonPhase";

  private readonly dragonMovePhase: DragonMovePhase;

  constructor(
    random: RandomGenerator,
    defaultNext: Phase | null,
    rewindActionContainer: RewindActionContainer | null = null,
  ) {
    super(random, defaultNext, rewindActionContainer);
    this.dragonMovePhase = new DragonMovePhase(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    const tile = state.getLastPlaced()!.getTile();
    if (tile.hasModifier(DragonCapability.DRAGON_TRIGGER)) {
      const pos: Position | null = state.getNeutralFigures().getDragonDeployment();
      if (pos !== null) {
        return this.next(state, this.dragonMovePhase);
      }
    }
    return this.next(state);
  }
}
