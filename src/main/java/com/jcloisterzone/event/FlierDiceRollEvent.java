package com.jcloisterzone.event;

import com.jcloisterzone.board.Position;
import io.vavr.collection.Set;

public class FlierDiceRollEvent extends PlayEvent {

    private Set<Position> positions;
    private final int value;
    private final String type;

    public FlierDiceRollEvent(PlayEventMeta metadata, Set<Position> positions, int value, String type) {
        super(metadata);
        this.positions = positions;
        this.value = value;
        this.type = type;
    }

    public int getValue() {
        return value;
    }

    public String getType() {
        return type;
    }

    public Set<Position> getPositions() {
        return positions;
    }
}
