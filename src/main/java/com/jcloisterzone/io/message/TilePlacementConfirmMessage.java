package com.jcloisterzone.io.message;

import com.jcloisterzone.io.MessageCommand;

@MessageCommand("TILE_CONFIRMED")
public class TilePlacementConfirmMessage extends AbstractMessage implements ReplayableMessage, RandomChangingMessage {

    private Double random;

    public TilePlacementConfirmMessage() {
    }

    @Override
    public Double getRandom() {
        return random;
    }

    @Override
    public void setRandom(Double random) {
        this.random = random;
    }
}
