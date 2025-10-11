package com.jcloisterzone.action;

import com.jcloisterzone.board.Position;
import io.vavr.collection.Set;

public class DonkeyAction extends SelectTileAction {

    private final String figureId;

    public DonkeyAction(String figureId, Set<Position> options) {
        super(options);
        this.figureId = figureId;
    }

    public String getFigureId() {
        return figureId;
    }
}
