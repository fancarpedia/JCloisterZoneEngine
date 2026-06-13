import type { ClassToken } from "../../../../lang/Class.js";
import type { Player } from "../../Player.js";
import type { PassMessage } from "../../io/message/PassMessage.js";
import { PassMessage as PassMessageClass } from "../../io/message/PassMessage.js";
import type { PlaceTileMessage } from "../../io/message/PlaceTileMessage.js";
import { PlaceTileMessage as PlaceTileMessageClass } from "../../io/message/PlaceTileMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { SetNextPlayer } from "../../reducers/SetNextPlayer.js";
import type { Capability } from "../Capability.js";
import { AbbeyCapability } from "../capability/AbbeyCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { AbstractAbbeyPhase } from "./AbstractAbbeyPhase.js";
import type { ActionPhase } from "./ActionPhase.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const ABBEY_CLS = AbbeyCapability as unknown as ClassToken<Capability<number>>;

/** After the last tile is placed, each player in turn (starting after the player
 *  who placed the last tile) may place their remaining abbey into a hole. */
export class AbbeyEndGamePhase extends AbstractAbbeyPhase {
  static readonly simpleName = "AbbeyEndGamePhase";

  private actionPhase: ActionPhase | null = null;

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  setActionPhase(actionPhase: ActionPhase): void {
    this.actionPhase = actionPhase;
  }

  enter(state: GameState): StepResult {
    let endPlayerIdx = state.getCapabilityModel<number>(ABBEY_CLS);
    if (endPlayerIdx === null || endPlayerIdx === undefined) {
      endPlayerIdx = state.getTurnPlayer()!.getIndex();
      state = state.setCapabilityModel<number>(ABBEY_CLS, endPlayerIdx);
    }
    return this.findNextAbbeyAction(state);
  }

  private findNextAbbeyAction(state: GameState): StepResult {
    const endPlayerIdx = state.getCapabilityModel<number>(ABBEY_CLS);
    let player: Player = state.getTurnPlayer()!;
    player = player.getNextPlayer(state);

    for (;;) {
      const hasAbbey =
        state.getPlayers().getPlayerTokenCount(player.getIndex(), AbbeyCapability.AbbeyToken.ABBEY_TILE) > 0;
      if (hasAbbey) {
        const action = this.createAbbeyAction(state);
        if (action !== null) {
          state = new SetNextPlayer(player).apply(state);
          state = state.setPlayerActions(new ActionsState(player, action as never, true));
          return this.promote(state);
        }
      }
      if (endPlayerIdx === player.getIndex()) break;
      player = player.getNextPlayer(state);
    }
    return this.next(state);
  }

  handlePass(state: GameState, _msg: PassMessage): StepResult {
    state = this.clearActions(state);
    return this.findNextAbbeyAction(state);
  }

  handlePlaceTile(state: GameState, msg: PlaceTileMessage): StepResult {
    state = this.applyPlaceTile(state, msg);
    return this.next(state, this.actionPhase!);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(PassMessageClass, this.handlePass);
    m.set(PlaceTileMessageClass, this.handlePlaceTile);
    return m;
  }
}
