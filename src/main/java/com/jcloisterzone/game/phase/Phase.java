package com.jcloisterzone.game.phase;

import com.jcloisterzone.game.state.Flag;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.io.message.PassMessage;
import com.jcloisterzone.io.message.PayRansomMessage;
import com.jcloisterzone.random.RandomGenerator;
import com.jcloisterzone.reducers.PayRansom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public abstract class Phase {

    protected final transient Logger logger = LoggerFactory.getLogger(getClass());

    private final RandomGenerator random;
    private Phase defaultNext;
    private RewindActionContainer rewindActionContainer;

    public Phase(RandomGenerator random, Phase defaultNext) {
        this.random = random;
        this.defaultNext = defaultNext;
        this.rewindActionContainer = null;
    }

    public Phase(RandomGenerator random, Phase defaultNext, RewindActionContainer rewindActionContainer) {
        this.random = random;
        this.defaultNext = defaultNext;
        this.rewindActionContainer = rewindActionContainer;
    }

    public Phase getDefaultNext() {
        return defaultNext;
    }

    public void setDefaultNext(Phase defaultNext) {
        this.defaultNext = defaultNext;
    }

    public StepResult next(GameState state) {
        return new StepResult(state, defaultNext);
    }

    public StepResult next(GameState state, Phase phase) {
        return new StepResult(state, phase);
    }

    public abstract StepResult enter(GameState state);

    protected StepResult promote(GameState state) {
        return new StepResult(state.setPhase(this), null);
    }

    protected GameState clearActions(GameState state) {
        return state.setPlayerActions(null);
    }

    @PhaseMessageHandler
    public StepResult handlePass(GameState state, PassMessage msg) {
        if (!state.getPlayerActions().isPassAllowed()) {
            throw new IllegalStateException("Pass is not allowed");
        }

        state = clearActions(state);
        if (!(state.getPhase() instanceof TowerCapturePhase) && !(state.getPhase() instanceof AbbeyPhase)) {
            state = state.addFlag(Flag.NO_PHANTOM);
        }
        return next(state);
    }

    @PhaseMessageHandler
    public StepResult handlePayRansom(GameState state, PayRansomMessage msg) {
        state = (new PayRansom(msg.getMeepleId())).apply(state);
        Phase target = null;
        if (state.hasFlag(Flag.WOOD_ACTION_CONFIRMED)) {
        	// No Rewind
        } else if (state.hasFlag(Flag.POST_WOOD_ACTION_STARTED)) {
        	// No Rewind
        } else if (state.hasFlag(Flag.PHANTOM_PHASE_DONE)) {
        	// No Rewind
        } else if (state.hasFlag(Flag.ACTION_PHASE_DONE)) {
        	target = rewindActionContainer.getPhantomPhase();
        } else {
        	target = rewindActionContainer.getActionPhase();
        }
        if (target == null) return promote(state);
        state = clearActions(state);
        return next(state, target);
    }

    public RandomGenerator getRandom() {
        return random;
    }

    @Override
    public String toString() {
        return getClass().getSimpleName();
    }
}
