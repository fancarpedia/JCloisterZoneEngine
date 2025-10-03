package com.jcloisterzone.game.token;

import com.jcloisterzone.game.Token;

public enum FlowersToken implements Token {
    FLOWERS_BLUE("blue"),
    FLOWERS_VIOLET("violet"),
    FLOWERS_WHITE("white"),
    FLOWERS_YELLOW("yellow");

    private final String value;

    FlowersToken(String value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return value;
    }
    
    public static FlowersToken fromValue(String value) {
        for (FlowersToken token : values()) {
            if (token.value.equals(value)) {
                return token;
            }
        }
        throw new IllegalArgumentException("Unknown flower token value: " + value);
    }
}
