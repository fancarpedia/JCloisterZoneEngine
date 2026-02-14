package com.jcloisterzone.event;

import com.jcloisterzone.board.pointer.BoardPointer;
import com.jcloisterzone.game.Token;

public class TokenRemovedEvent extends PlayEvent {

    private static final long serialVersionUID = 1L;

    private final Token token;
    private final BoardPointer pointer;
    private final int count;
    private final boolean forced;

    public TokenRemovedEvent(PlayEventMeta metadata, Token token, BoardPointer pointer, int count, boolean forced) {
        super(metadata);
        this.token = token;
        this.pointer = pointer;
        this.count = count;
        this.forced = forced;
    }

    public Token getToken() {
        return token;
    }

    public BoardPointer getPointer() {
        return pointer;
    }

    public int getCount() {
        return count;
    }

    public boolean getForced() {
        return forced;
    }
}
