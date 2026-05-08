package com.jcloisterzone.feature;

import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Rotation;
import com.jcloisterzone.board.pointer.FeaturePointer;
import io.vavr.collection.List;


public class CourierLetter extends TileFeature implements Structure {

    private static final List<FeaturePointer> INITIAL_PLACE = List.of(new FeaturePointer(Position.ZERO, CourierLetter.class, Location.I));

    public CourierLetter() {
        this(INITIAL_PLACE);
    }

    public CourierLetter(List<FeaturePointer> places) {
        super(places);
    }

    @Override
    public Feature placeOnBoard(Position pos, Rotation rot) {
        return new CourierLetter(placeOnBoardPlaces(pos, rot));
    }

    public static String name() {
        return "CourierLetter";
    }
}
