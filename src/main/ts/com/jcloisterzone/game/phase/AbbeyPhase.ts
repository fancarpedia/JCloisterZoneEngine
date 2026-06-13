import type { RandomGenerator } from "../../random/RandomGenerator.js";
import type { PlaceTileMessage } from "../../io/message/PlaceTileMessage.js";
import { PlaceTileMessage as PlaceTileMessageClass } from "../../io/message/PlaceTileMessage.js";
import { AbbeyCapability } from "../capability/AbbeyCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { AbstractAbbeyPhase } from "./AbstractAbbeyPhase.js";
import type { ActionPhase } from "./ActionPhase.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";
import type { TilePhase } from "./TilePhase.js";

/** Start-of-turn-part phase: the active player may place their abbey tile into a
 *  hole instead of drawing a tile. If they don't (or can't), play falls through to
 *  the normal TilePhase. */
export class AbbeyPhase extends AbstractAbbeyPhase {
  static readonly simpleName = "AbbeyPhase";

  private tilePhase: TilePhase | null = null;
  private actionPhase: ActionPhase | null = null;

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  setTilePhase(tilePhase: TilePhase): void {
    this.tilePhase = tilePhase;
  }
  setActionPhase(actionPhase: ActionPhase): void {
    this.actionPhase = actionPhase;
  }

  enter(state: GameState): StepResult {
    // TODO(bazaar/builder): suppress abbey during a bazaar auction unless in the
    // builder's second turn part. Without those capabilities the guard is just hasAbbey.
    const turnIdx = state.getPlayers().getTurnPlayerIndex()!;
    const hasAbbey =
      state.getPlayers().getPlayerTokenCount(turnIdx, AbbeyCapability.AbbeyToken.ABBEY_TILE) > 0;
    if (hasAbbey) {
      const action = this.createAbbeyAction(state);
      if (action !== null) {
        state = state.setPlayerActions(new ActionsState(state.getTurnPlayer()!, action as never, true));
        return this.promote(state);
      }
    }
    return this.next(state, this.tilePhase!);
  }

  handlePlaceTile(state: GameState, msg: PlaceTileMessage): StepResult {
    state = this.applyPlaceTile(state, msg);
    return this.next(state, this.actionPhase!);
  }

  /** Passing the abbey must NOT set the NO_PHANTOM flag (Java excludes AbbeyPhase). */
  protected override addNoPhantomFlagOnPass(_state: GameState): boolean {
    return false;
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(PlaceTileMessageClass, this.handlePlaceTile);
    return m;
  }
}
