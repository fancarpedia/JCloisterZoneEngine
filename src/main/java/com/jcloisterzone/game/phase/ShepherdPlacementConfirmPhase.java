package com.jcloisterzone.game.phase;

import com.jcloisterzone.action.ShepherdPlacementConfirmAction;
import com.jcloisterzone.event.MeepleDeployed;
import com.jcloisterzone.figure.Shepherd;
import com.jcloisterzone.game.state.ActionsState;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.io.message.ShepherdPlacementConfirmMessage;
import com.jcloisterzone.random.RandomGenerator;

public class ShepherdPlacementConfirmPhase extends Phase {
    
	public ShepherdPlacementConfirmPhase(RandomGenerator random, Phase defaultNext, RewindActionContainer rewindActionContainer) {
		super(random, defaultNext, rewindActionContainer);
	}

	@Override
    public StepResult enter(GameState state) {
        // Check if a shepherd was just placed in this turn part
        boolean shepherdPlaced = !state.getCurrentTurnPartEvents()
            .filter(ev -> ev instanceof MeepleDeployed)
            .map(ev -> (MeepleDeployed) ev)
            .filter(ev -> ev.getMeeple() instanceof Shepherd && ev.getMovedFrom() == null).isEmpty();
        
        if (!shepherdPlaced) {
            return next(state);
        }

        return promote(state.setPlayerActions(new ActionsState(state.getTurnPlayer(), new ShepherdPlacementConfirmAction(), false)));
    }
    
    @PhaseMessageHandler
    public StepResult handleShepherdPlacementConfirm(GameState state, ShepherdPlacementConfirmMessage msg) {
        state = clearActions(state);
        return next(state);
    }
}
