import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { JavaEnum } from "../../../../lang/JavaEnum.js";
import { Location } from "../../board/Location.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { BridgeAction } from "../../action/BridgeAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { TokenPlacedEvent } from "../../event/TokenPlacedEvent.js";
import { Road } from "../../feature/Road.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { Capability } from "../Capability.js";
import type { Token } from "../Token.js";
import type { GameState } from "../state/GameState.js";

/** Bridges (Bridges, Castles &amp; Bazaars). Model: set of placed bridges. */
export class BridgeCapability extends Capability<Set<FeaturePointer>> {
  override onStartGame(state: GameState, random: RandomGenerator): GameState {
    const tokens = state.getPlayers().length() < 5 ? 3 : 2;
    state = state.mapPlayers((ps) =>
      ps.setTokenCountForAllPlayers(BridgeCapability.BridgeToken.BRIDGE, tokens),
    );
    return this.setModel(state, HashSet.empty<FeaturePointer>());
  }

  override onActionPhaseEntered(state: GameState): GameState {
    const player = state.getPlayerActions()!.getPlayer();
    const playerHasBridge =
      state.getPlayers().getPlayerTokenCount(player.getIndex(), BridgeCapability.BridgeToken.BRIDGE) > 0;
    // at most one bridge per turn part
    const alreadyPlaced = state
      .getCurrentTurnPartEvents()
      .find((ev) => ev instanceof TokenPlacedEvent && ev.getToken() === BridgeCapability.BridgeToken.BRIDGE)
      .isDefined();
    if (!playerHasBridge || alreadyPlaced) return state;

    const pos = state.getLastPlaced()!.getPosition();
    let options: Set<FeaturePointer> = HashSet.empty<FeaturePointer>();
    for (const bridgeLoc of Location.BRIDGES) {
      const ptr = new FeaturePointer(pos, Road as never, bridgeLoc);
      if (state.isBridgePlacementAllowed(ptr)) options = options.add(ptr);
    }
    if (options.isEmpty()) return state;
    return state.appendAction(new BridgeAction(options) as unknown as PlayerAction<unknown>);
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BridgeCapability {
  export class BridgeToken extends JavaEnum implements Token {
    static readonly BRIDGE = new BridgeToken("BRIDGE", 0);
    private static readonly VALUES: readonly BridgeToken[] = [BridgeToken.BRIDGE];
    static values(): readonly BridgeToken[] {
      return BridgeToken.VALUES;
    }
  }
}

Capability.register(BridgeCapability);
