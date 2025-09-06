package com.jcloisterzone.io.message;

import com.jcloisterzone.io.MessageCommand;

@MessageCommand("AI")
public class AiMessage extends AbstractMessage implements ReplayableMessage, RandomChangingMessage {

    private Double random;

    public AiMessage() {
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
