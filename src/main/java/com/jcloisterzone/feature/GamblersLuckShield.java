package com.jcloisterzone.feature;

import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Rotation;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.game.capability.GamblersLuckCapability.GamblersLuckShieldToken;
import com.jcloisterzone.game.state.GameState;

import io.vavr.collection.List;

public class GamblersLuckShield extends TileFeature implements Structure {

    private final GamblersLuckShieldToken shieldToken;

    public GamblersLuckShield(Location loc) {
        this(List.of(new FeaturePointer(Position.ZERO, GamblersLuckShield.class, loc)), null);
    }

    public GamblersLuckShield(List<FeaturePointer> places, GamblersLuckShieldToken shieldToken) {
        super(places);
        this.shieldToken = shieldToken;
    }

    @Override
    public GamblersLuckShield placeOnBoard(Position pos, Rotation rot) {
        return new GamblersLuckShield(placeOnBoardPlaces(pos, rot), shieldToken);
    }

    public GamblersLuckShield setShieldToken(GamblersLuckShieldToken shieldToken) {
        return new GamblersLuckShield(places, shieldToken);
    }

    public GamblersLuckShieldToken getShieldToken() {
        return shieldToken;
    }

    public static String name() {
        return "GamblersLuckShield";
    }
}
