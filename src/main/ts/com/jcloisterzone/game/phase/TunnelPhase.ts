import { Vector } from "../../../../io/vavr/SeqTypes.js";
import type { ClassToken } from "../../../../lang/Class.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import type { PlaceTokenMessage } from "../../io/message/PlaceTokenMessage.js";
import { PlaceTokenMessage as PlaceTokenMessageClass } from "../../io/message/PlaceTokenMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { PlaceTunnel } from "../../reducers/PlaceTunnel.js";
import type { Capability } from "../Capability.js";
import { TunnelCapability } from "../capability/TunnelCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import { Flag } from "../state/Flag.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { RewindActionContainer } from "./RewindActionContainer.js";
import type { StepResult } from "./StepResult.js";

const TUNNEL_CLS = TunnelCapability as unknown as ClassToken<TunnelCapability>;

/** Dedicated phase (after the action phase) that lets the turn player place a tunnel
 *  token, if they didn't already place one this turn. */
export class TunnelPhase extends Phase {
  static readonly simpleName = "TunnelPhase";

  constructor(
    random: RandomGenerator,
    defaultNext: Phase | null,
    rewindActionContainer: RewindActionContainer | null = null,
  ) {
    super(random, defaultNext, rewindActionContainer);
  }

  enter(state: GameState): StepResult {
    if (state.hasFlag(Flag.TUNNEL_PLACED)) return this.next(state);
    const cap = state.getCapabilities().get(TUNNEL_CLS) as TunnelCapability;
    const actions = cap.createTunnelActions(state);
    if (actions.length === 0) return this.next(state);
    return this.promote(
      state.setPlayerActions(
        new ActionsState(state.getTurnPlayer()!, Vector.ofAll(actions as unknown as PlayerAction<unknown>[]), true),
      ),
    );
  }

  handlePlaceToken(state: GameState, msg: PlaceTokenMessage): StepResult {
    const player = state.getActivePlayer()!;
    const token = msg.getToken()!;
    state = state.mapPlayers((ps) => ps.addTokenCount(player.getIndex(), token, -1));
    if (!(token instanceof TunnelCapability.Tunnel)) {
      throw new Error("Only tunnel token placement is allowed");
    }
    state = new PlaceTunnel(token, msg.getPointer() as FeaturePointer).apply(state);
    state = this.clearActions(state);
    return this.enter(state);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(PlaceTokenMessageClass, this.handlePlaceToken);
    return m;
  }
}
