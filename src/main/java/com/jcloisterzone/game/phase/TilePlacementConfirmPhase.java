package com.jcloisterzone.game.phase;

import com.jcloisterzone.action.TilePlacementConfirmAction;
import com.jcloisterzone.board.Tile;
import com.jcloisterzone.game.capability.MeteoriteCapability;
import com.jcloisterzone.game.state.ActionsState;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.io.message.TilePlacementConfirmMessage;
import com.jcloisterzone.random.RandomGenerator;
import io.vavr.collection.Vector;

public class TilePlacementConfirmPhase extends Phase {

    public TilePlacementConfirmPhase(RandomGenerator random, Phase defaultNext) {
        super(random, defaultNext);
    }

    @Override
    public StepResult enter(GameState state) {
        Tile tile = state.getLastPlaced().getTile();

        if (!tile.hasModifier(MeteoriteCapability.CRATER)) {
        	// Skip confirm on non Meteorite
            return next(state);
        }

        return promote(state.setPlayerActions(new ActionsState(state.getTurnPlayer(), new TilePlacementConfirmAction(), false)));
    }

    @PhaseMessageHandler
    public StepResult handleTilePlacementConfirm(GameState state, TilePlacementConfirmMessage msg) {

    	if (state.hasCapability(MeteoriteCapability.class)) {
            state = state.getCapabilities().get(MeteoriteCapability.class).confirmedTilePlacement(state);
        }

        state = clearActions(state);
        return next(state);
    }
}
