package com.jcloisterzone.figure.neutral;

import com.jcloisterzone.Immutable;
import com.jcloisterzone.board.pointer.BoardPointer;

@Immutable
public class Donkey extends NeutralFigure<BoardPointer> {

    private static final long serialVersionUID = 1L;

    public Donkey(String id) {
        super(id);
    }
}
