import type { ClassToken } from "../../../../lang/Class.js";
import type { Position } from "../../board/Position.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { Circus } from "../../feature/Circus.js";
import type { NeutralFigure } from "../../figure/neutral/NeutralFigure.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { MoveNeutralFigure } from "../../reducers/MoveNeutralFigure.js";
import { BigTopCapability } from "../capability/BigTopCapability.js";
import type { GameState } from "../state/GameState.js";
import { Phase } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const BIGTOP_CLS = BigTopCapability as unknown as ClassToken<BigTopCapability>;

/** After placing a tile with a circus, scores the followers around the Big Top's current
 *  circus (with a random unused animal token) and walks the Big Top to the new circus. */
export class BigTopPhase extends Phase {
  static readonly simpleName = "BigTopPhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    const pt = state.getLastPlaced()!;
    const hasCircus = pt.getTile().getInitialFeatures().exists((t) => t._2 instanceof Circus);
    if (hasCircus) {
      state = this.moveBigTop(state, pt.getPosition());
    }
    return this.next(state);
  }

  private moveBigTop(state: GameState, pos: Position): GameState {
    const capability = state.getCapabilities().get(BIGTOP_CLS) as BigTopCapability;
    const bigtop = state.getNeutralFigures().getBigTop()!;

    const currentPos = state.getNeutralFigures().getBigTopDeployment();
    if (currentPos !== null) {
      const unusedTokens = capability.getUnusedTokens(state);
      const token = unusedTokens[this.getRandom().getNextInt(unusedTokens.length)];
      state = capability.scoreBigTop(state, currentPos, token, false);
    }

    state = new MoveNeutralFigure(bigtop as unknown as NeutralFigure<BoardPointer>, pos as unknown as BoardPointer).apply(state);
    return state;
  }
}
