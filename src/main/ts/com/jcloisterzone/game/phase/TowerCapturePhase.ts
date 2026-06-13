import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import type { ClassToken } from "../../../../lang/Class.js";
import type { Arr, List } from "../../../../io/vavr/SeqTypes.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { MeeplePointer } from "../../board/pointer/MeeplePointer.js";
import { Castle } from "../../feature/Castle.js";
import { Tower } from "../../feature/Tower.js";
import { Follower } from "../../figure/Follower.js";
import type { Player } from "../../Player.js";
import { CaptureFollowerAction } from "../../action/CaptureFollowerAction.js";
import { SelectPrisonerToExchangeAction } from "../../action/SelectPrisonerToExchangeAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import type { TokenPlacedEvent } from "../../event/TokenPlacedEvent.js";
import type { CaptureFollowerMessage } from "../../io/message/CaptureFollowerMessage.js";
import { CaptureFollowerMessage as CaptureFollowerMessageClass } from "../../io/message/CaptureFollowerMessage.js";
import type { ExchangeFollowerChoiceMessage } from "../../io/message/ExchangeFollowerChoiceMessage.js";
import { ExchangeFollowerChoiceMessage as ExchangeFollowerChoiceMessageClass } from "../../io/message/ExchangeFollowerChoiceMessage.js";
import { CaptureMeeple } from "../../reducers/CaptureMeeple.js";
import { PrisonersExchage } from "../../reducers/PrisonersExchage.js";
import type { Capability } from "../Capability.js";
import { TowerCapability } from "../capability/TowerCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const TOWER_CLS = TowerCapability as unknown as ClassToken<Capability<Arr<List<Follower>>>>;

/** After a tower piece is placed, offers the follower(s) in range to capture. */
export class TowerCapturePhase extends Phase {
  static readonly simpleName = "TowerCapturePhase";

  enter(state: GameState): StepResult {
    const event = state.getEvents().last() as TokenPlacedEvent;
    const token = event.getToken() as TowerCapability.TowerToken;
    const ptr = event.getPointer() as FeaturePointer;
    const tower = state.getFeature(ptr) as Tower;
    const towerHeight = tower.getPieces().size();
    const towerPos = ptr.getPosition();
    const isStraight = token === TowerCapability.TowerToken.TOWER_PIECE;

    const opts: MeeplePointer[] = [];
    for (const t of state.getDeployedMeeples()) {
      const m = t._1;
      const fp = t._2;
      const pos = fp.getPosition();
      if (!(m instanceof Follower)) continue;
      const aligned = isStraight
        ? pos.x === towerPos.x || pos.y === towerPos.y
        : Math.abs(pos.x - towerPos.x) === Math.abs(pos.y - towerPos.y);
      if (!aligned) continue;
      const dist = isStraight ? pos.squareDistance(towerPos) : pos.diagonalDistance(towerPos);
      if (dist > towerHeight) continue;
      if (state.getFeature(fp) instanceof Castle) continue;
      opts.push(new MeeplePointer(fp, m.getId()));
    }

    if (opts.length === 0) return this.next(state);

    const options: Set<MeeplePointer> = HashSet.ofAll(opts);
    state = state.setPlayerActions(
      new ActionsState(
        state.getTurnPlayer()!,
        new CaptureFollowerAction(options) as unknown as PlayerAction<unknown>,
        true,
      ),
    );
    return this.promote(state);
  }

  handleCaptureFollower(state: GameState, msg: CaptureFollowerMessage): StepResult {
    const ptr = msg.getPointer()!;
    const player = state.getActivePlayer()!;
    const meeple = state
      .getDeployedMeeples()
      .find((m) => ptr.match(m._1))
      .map((t) => t._1)
      .getOrNull() as Follower | null;
    if (meeple === null) throw new Error("Pointer doesn't match any meeple");
    state = new CaptureMeeple(meeple).apply(state);

    // skip exchange when the player's OWN follower was captured
    if (!player.equals(meeple.getPlayer())) {
      const captured = this.getPrisonersCapturedBy(state, player, meeple.getPlayer());
      // group prisoners by follower class
      const byClass = new globalThis.Map<unknown, Follower[]>();
      for (const f of captured) {
        const k = f.constructor;
        (byClass.get(k) ?? byClass.set(k, []).get(k)!).push(f);
      }
      if (byClass.size === 1) {
        // only one follower type captured → exchange automatically
        const exchangeFor = [...byClass.values()][0][0];
        state = new PrisonersExchage(meeple, exchangeFor).apply(state);
      } else if (byClass.size > 1) {
        let options: Set<Follower> = HashSet.empty<Follower>();
        for (const list of byClass.values()) options = options.add(list[0]);
        const action = new SelectPrisonerToExchangeAction(meeple, options);
        state = state.setPlayerActions(
          new ActionsState(player, action as unknown as PlayerAction<unknown>, false),
        );
        return this.promote(state);
      }
    }
    state = this.clearActions(state);
    return this.next(state);
  }

  handleExchangeFollowerChoice(state: GameState, msg: ExchangeFollowerChoiceMessage): StepResult {
    const action = state.getPlayerActions()!.getActions().head() as SelectPrisonerToExchangeAction;
    const follower = action.getJustCapturedFollower();
    const exchangeFor = state.getPlayers().findFollower(msg.getMeepleId()).get();
    state = new PrisonersExchage(follower, exchangeFor).apply(state);
    state = this.clearActions(state);
    return this.next(state);
  }

  private getPrisonersCapturedBy(
    state: GameState,
    owner: Player,
    jailer: Player,
  ): List<Follower> {
    return state
      .getCapabilityModel<Arr<List<Follower>>>(TOWER_CLS)!
      .get(jailer.getIndex())
      .filter((f) => f.getPlayer().equals(owner)) as List<Follower>;
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(CaptureFollowerMessageClass, this.handleCaptureFollower);
    m.set(ExchangeFollowerChoiceMessageClass, this.handleExchangeFollowerChoice);
    return m;
  }
}
