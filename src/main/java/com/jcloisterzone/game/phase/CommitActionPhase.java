package com.jcloisterzone.game.phase;

import com.jcloisterzone.Player;
import com.jcloisterzone.action.ConfirmAction;
import com.jcloisterzone.game.state.ActionsState;
import com.jcloisterzone.game.state.Flag;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.io.message.CommitMessage;
import com.jcloisterzone.random.RandomGenerator;

public class CommitActionPhase extends Phase {

    public CommitActionPhase(RandomGenerator random, Phase defaultNext) {
        super(random, defaultNext);
    }

    public CommitActionPhase(RandomGenerator random, Phase defaultNext, RewindActionContainer rewindActionContainer) {
        super(random, defaultNext, rewindActionContainer);
    }

    @Override
    public StepResult enter(GameState state) {
        if (state.isCommited()) {
            return next(state);
        }
        Player player = state.getTurnPlayer();
        state = state.setPlayerActions(
            new ActionsState(player, new ConfirmAction(), false)
        );
        return promote(state);
    }

    @PhaseMessageHandler
    public StepResult handleCommit(GameState state, CommitMessage msg) {
    	state = state.addFlag(Flag.WOOD_ACTION_CONFIRMED);
        state = clearActions(state);
        return next(state);
    }
}
