package com.jcloisterzone.io.message;

import com.jcloisterzone.io.MessageCommand;

@MessageCommand("AI")
public class AiMessage extends AbstractMessage implements ReplayableMessage, RandomChangingMessage {

    private Double random;
    
    private Integer player;

    private Integer seq;

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

    public Integer getPlayer() {
        return player;
    }

    public void setPlayer(Integer player) {
        this.player = player;
    }

    public Integer getSeq() {
        return seq;
    }

    public void setSeq(Integer seq) {
        this.seq = seq;
    }
}
