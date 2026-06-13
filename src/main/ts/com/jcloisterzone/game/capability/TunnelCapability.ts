import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { Vector } from "../../../../io/vavr/SeqTypes.js";
import { JavaEnum } from "../../../../lang/JavaEnum.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { TunnelAction } from "../../action/TunnelAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { PlaceTunnel } from "../../reducers/PlaceTunnel.js";
import { Capability } from "../Capability.js";
import { Rule } from "../Rule.js";
import type { Token } from "../Token.js";
import { ActionsState } from "../state/ActionsState.js";
import { Flag } from "../state/Flag.js";
import type { GameState } from "../state/GameState.js";
import type { PlacedTunnelToken } from "../state/PlacedTunnelToken.js";

import { isInstanceOfFeatureCompletionBlocker } from "./trait/FeatureCompletionBlocker.js";

/** Tunnels (mini-expansion). Model: map of placed tunnel tokens. */
export class TunnelCapability extends Capability<VMap<FeaturePointer, PlacedTunnelToken>> {
  override onStartGame(state: GameState, random: RandomGenerator): GameState {
    const playersCount = state.getPlayers().getPlayers().length();
    const moreTokens = state.getStringRule(Rule.MORE_TUNNEL_TOKENS);
    const T = TunnelCapability.Tunnel;
    state = state.mapPlayers((ps) => {
      ps = ps.setTokenCountForAllPlayers(T.TUNNEL_A, 2);
      if (playersCount === 3 && moreTokens === "3/2") {
        ps = ps.setTokenCountForAllPlayers(T.TUNNEL_B, 2);
      }
      if (playersCount < 3) {
        if (moreTokens !== "1/1") {
          ps = ps.setTokenCountForAllPlayers(T.TUNNEL_B, 2);
          if (moreTokens === "3/2") {
            ps = ps.setTokenCountForAllPlayers(T.TUNNEL_C, 2);
          }
        }
      }
      return ps;
    });
    return this.setModel(state, HashMap.empty<FeaturePointer, PlacedTunnelToken>());
  }

  override onActionPhaseEntered(state: GameState): GameState {
    if (state.hasFlag(Flag.TUNNEL_PLACED)) return state;
    const actions = this.createTunnelActions(state);
    if (actions.length === 0) return state;
    let as = state.getPlayerActions()!;
    for (const action of actions) as = as.appendAction(action as unknown as PlayerAction<unknown>);
    return state.setPlayerActions(as);
  }

  /** A TunnelAction per tunnel-token colour the turn player still holds, over the open
   *  tunnel ends. With the last token of a colour, ends whose completion would be blocked
   *  (e.g. by a donkey) are excluded. */
  createTunnelActions(state: GameState): TunnelAction[] {
    const model = this.getModel(state);
    const openTunnels: Set<FeaturePointer> = HashSet.ofAll(
      model.filterValues((v) => v === null).toArray().map((t) => t._1),
    );
    if (openTunnels.isEmpty()) return [];

    const player = state.getTurnPlayer()!;
    const activePlayer = state.getActivePlayer();
    const actions: TunnelAction[] = [];
    for (const token of TunnelCapability.Tunnel.values()) {
      const count = state.getPlayers().getPlayerTokenCount(player.getIndex(), token);
      if (count === 0) continue;
      let allowedTunnels: Set<FeaturePointer> = openTunnels;
      if (count === 1) {
        allowedTunnels = HashSet.empty<FeaturePointer>();
        for (const cap of state.getCapabilities().toSeq()) {
          if (!isInstanceOfFeatureCompletionBlocker(cap)) continue;
          for (const fp of openTunnels) {
            const as =
              activePlayer !== null
                ? state.getPlayerActions()!.appendAction(new TunnelAction(openTunnels, token) as unknown as PlayerAction<unknown>)
                : new ActionsState(player, Vector.of(new TunnelAction(openTunnels, token) as unknown as PlayerAction<unknown>), true);
            let sim = state.setPlayerActions(as);
            sim = new PlaceTunnel(token, fp).apply(sim);
            if (!cap.isFeatureCompletionBlocked(sim, fp)) allowedTunnels = allowedTunnels.add(fp);
          }
        }
      }
      actions.push(new TunnelAction(allowedTunnels, token));
    }
    return actions;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TunnelCapability {
  export class Tunnel extends JavaEnum implements Token {
    static readonly TUNNEL_A = new Tunnel("TUNNEL_A", 0);
    static readonly TUNNEL_B = new Tunnel("TUNNEL_B", 1);
    static readonly TUNNEL_C = new Tunnel("TUNNEL_C", 2);
    private static readonly VALUES: readonly Tunnel[] = [Tunnel.TUNNEL_A, Tunnel.TUNNEL_B, Tunnel.TUNNEL_C];
    static values(): readonly Tunnel[] {
      return Tunnel.VALUES;
    }
    static valueOf(name: string): Tunnel {
      const v = Tunnel.VALUES.find((t) => t.name() === name);
      if (v === undefined) throw new Error("No tunnel token " + name);
      return v;
    }
  }
}

Capability.register(TunnelCapability);
