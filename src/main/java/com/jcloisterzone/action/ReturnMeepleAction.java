package com.jcloisterzone.action;

import com.jcloisterzone.board.pointer.MeeplePointer;
import com.jcloisterzone.game.ReturnMeepleSource;
import io.vavr.collection.Set;

public class ReturnMeepleAction extends AbstractPlayerAction<MeeplePointer> {

    private final ReturnMeepleSource returnMeepleSource;

    public ReturnMeepleAction(Set<MeeplePointer> options, ReturnMeepleSource returnMeepleSource) {
        super(options);
        this.returnMeepleSource = returnMeepleSource;
    }

    public ReturnMeepleSource getReturnMeepleSource() {
        return returnMeepleSource;
    }
}
