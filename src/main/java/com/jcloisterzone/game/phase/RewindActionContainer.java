package com.jcloisterzone.game.phase;

/**
 *  Rewind Actions container for option when Towr Ransom Pay, possibility to revert Action Phase
 *  ActionPhase can be skipped empty Actions
 *  PhantomPhase can be skipped when no Phantom avaialble (captured by tower)
 */
public class RewindActionContainer {

    private Phase actionPhase;
    private Phase phantomPhase;

    public RewindActionContainer() {
    	
    }

	public RewindActionContainer(Phase actionPhase, Phase phantomPhase) {
        this.actionPhase = actionPhase;
        this.phantomPhase = phantomPhase;
    }

    public RewindActionContainer setActionPhase(Phase actionPhase) {
        this.actionPhase = actionPhase;
        return this;
    }

    public Phase getActionPhase() {
    	return actionPhase;
    }

    public RewindActionContainer setPhantomPhase(Phase phantomPhase) {
        this.phantomPhase = phantomPhase;
        return this;
    }

    public Phase getPhantomPhase() {
    	return phantomPhase;
    }

}
