package com.jcloisterzone.io.message;

import com.jcloisterzone.io.MessageCommand;

@MessageCommand("SHEPHERD_CONFIRM")
public class ShepherdPlacementConfirmMessage extends AbstractMessage implements ReplayableMessage, RandomChangingMessage {

    private Double random;

    public ShepherdPlacementConfirmMessage() {
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
