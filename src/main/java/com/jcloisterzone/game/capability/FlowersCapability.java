package com.jcloisterzone.game.capability;

import com.jcloisterzone.Player;
import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Tile;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.feature.AbbeyEdge;
import com.jcloisterzone.feature.Monastery;
import com.jcloisterzone.feature.Feature;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.Token;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlayersState;
import com.jcloisterzone.random.RandomGenerator;
import io.vavr.collection.HashMap;
import io.vavr.collection.HashSet;
import io.vavr.collection.List;
import io.vavr.collection.Map;

public class FlowersCapability extends Capability<Void> {

	public enum FlowersToken implements Token {
		FLOWERS_BLUE,
		FLOWERS_VIOLET,
		FLOWERS_WHITE,
		FLOWERS_YELLOW,
	}

	private static final long serialVersionUID = 1L;

    @Override
    public GameState onStartGame(GameState state, RandomGenerator random) {
        PlayersState ps = state.getPlayers();
    	int multiplier = (int) Math.ceil(ps.getPlayers().size() / 4.0); // 1 for 1–4 players, 2 for 5–8, etc.

        List<FlowersToken> pool = List.empty();
        for (int i = 0; i < multiplier; i++) {
            pool = pool.appendAll(List.of(FlowersToken.values()));
        }

        for (Player p : ps.getPlayers()) {
        	int idx = random.getNextInt(pool.size());
	        FlowersToken token = pool.get(idx);
	        pool = pool.removeAt(idx);
	        ps = ps.setTokenCount(p.getIndex(), token, 1);
        }

        return state.setPlayers(ps);
    }

}
