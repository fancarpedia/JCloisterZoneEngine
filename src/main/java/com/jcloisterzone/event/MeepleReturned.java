package com.jcloisterzone.event;

import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.figure.Meeple;
import com.jcloisterzone.game.ReturnMeepleSource;

public class MeepleReturned extends PlayEvent {

    private static final long serialVersionUID = 1L;

    private Meeple meeple;
    private FeaturePointer from;
    /** true if meeple is returned different way than scoring feature */
    private final boolean forced;
    private ReturnMeepleSource returnMeepleSource;

    public MeepleReturned(PlayEventMeta metadata, Meeple meeple, FeaturePointer from, boolean forced, ReturnMeepleSource returnMeepleSource) {
        super(metadata);
        this.meeple = meeple;
        this.from = from;
        this.forced = forced;
        this.returnMeepleSource = returnMeepleSource;
    }

    public Meeple getMeeple() {
        return meeple;
    }

    public FeaturePointer getFrom() {
        return from;
    }

    public boolean isForced() {
        return forced;
    }

    public ReturnMeepleSource getReturnMeepleSource() {
        return returnMeepleSource;
    }
}
