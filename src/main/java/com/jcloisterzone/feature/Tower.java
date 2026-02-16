package com.jcloisterzone.feature;

import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Rotation;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.game.capability.TowerCapability;

import io.vavr.collection.List;

public class Tower extends TileFeature implements Structure {

    private static final List<FeaturePointer> INITIAL_PLACE = List.of(new FeaturePointer(Position.ZERO, Tower.class, Location.I));

    private List<TowerCapability.TowerToken> pieces = List.empty();

    public Tower() {
        this(INITIAL_PLACE, List.empty());
    }

    public Tower(List<FeaturePointer> places, List<TowerCapability.TowerToken> pieces) {
        super(places);
        this.pieces = pieces;
    }

    @Override
    public Tower placeOnBoard(Position pos, Rotation rot) {
        return new Tower(placeOnBoardPlaces(pos, rot), pieces);
    }

    public Tower addPiece(TowerCapability.TowerToken token) {
        return new Tower(places, pieces.append(token));
    }

    public List<TowerCapability.TowerToken> getPieces() {
        return pieces;
    }

    public boolean matchLastPiece(TowerCapability.TowerToken token) {
    	if (getPieces().size()==0) {
    		return false;
    	}
    	return getPieces().lastOption().get().equals(token);
    }

    public static String name() {
        return "Tower";
    }
}
