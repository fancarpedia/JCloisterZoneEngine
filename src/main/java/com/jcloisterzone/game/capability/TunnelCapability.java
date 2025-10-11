package com.jcloisterzone.game.capability;

import com.jcloisterzone.Player;
import com.jcloisterzone.action.TunnelAction;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.Rule;
import com.jcloisterzone.game.Token;
import com.jcloisterzone.game.state.ActionsState;
import com.jcloisterzone.game.state.Flag;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTunnelToken;
import com.jcloisterzone.random.RandomGenerator;
import io.vavr.Predicates;
import io.vavr.Tuple2;
import io.vavr.collection.HashMap;
import io.vavr.collection.List;
import io.vavr.collection.Map;
import io.vavr.collection.Set;

import java.util.ArrayList;

/**
 * Capability model is {@code Map<FeaturePointer, String>} - tunnels,
 *   key is tunnel token id or null if nothing is placed
 */
public final class TunnelCapability extends Capability<Map<FeaturePointer, PlacedTunnelToken>> {

	public enum Tunnel implements Token {
		TUNNEL_A,
		TUNNEL_B,
		TUNNEL_C
    }

	private static final long serialVersionUID = 1L;

    @Override
    public GameState onStartGame(GameState state, RandomGenerator random) {
        int playersCount = state.getPlayers().getPlayers().length();
        String moreTokens = state.getStringRule(Rule.MORE_TUNNEL_TOKENS);
        state = state.mapPlayers(ps -> {
            ps = ps.setTokenCountForAllPlayers(Tunnel.TUNNEL_A, 2);
            if (playersCount == 3 && "3/2".equals(moreTokens)) {
                ps = ps.setTokenCountForAllPlayers(Tunnel.TUNNEL_B, 2);
            }
            if (playersCount < 3) {
                if (!"1/1".equals(moreTokens)) {
                    ps = ps.setTokenCountForAllPlayers(Tunnel.TUNNEL_B, 2);
                    if ("3/2".equals(moreTokens)) {
                        ps = ps.setTokenCountForAllPlayers(Tunnel.TUNNEL_C, 2);
                    }
                }
            }
            return ps;
        });
        state = setModel(state, HashMap.empty());
        return state;
    }

    @Override
    public GameState onActionPhaseEntered(GameState state) {
        Player player = state.getPlayerActions().getPlayer();

        if (state.hasFlag(Flag.TUNNEL_PLACED)) {
            return state;
        }

        java.util.List<TunnelAction> actions = createTunnelActions(state);
        if (actions.isEmpty()) {
            return state;
        }

        ActionsState as = state.getPlayerActions();
        for (TunnelAction action: actions) {
            as = as.appendAction(action);
        }
        return state.setPlayerActions(as);
    }

    public java.util.List<TunnelAction> createTunnelActions(GameState state) {
        java.util.List actions = new ArrayList(3);
        Player player = state.getTurnPlayer();

        Set<FeaturePointer> openTunnels = getModel(state)
                .filterValues(Predicates.isNull())
                .map(Tuple2::_1)
                .toSet();

        if (openTunnels.isEmpty()) {
            return actions;
        }

        ActionsState as = state.getPlayerActions();
        for (Tunnel token : Tunnel.values()) {
            if (state.getPlayers().getPlayerTokenCount(player.getIndex(), token) == 0) {
                continue;
            }
            actions.add(new TunnelAction(openTunnels, token));
        }
        return actions;
    }
}
