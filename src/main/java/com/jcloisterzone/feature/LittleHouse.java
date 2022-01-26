package com.jcloisterzone.feature;

import com.jcloisterzone.board.Edge;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Rotation;
import com.jcloisterzone.board.pointer.FeaturePointer;
import io.vavr.collection.List;

public class LittleHouse extends TileFeature implements EdgeFeature<LittleHouse> {

    public LittleHouse(List<FeaturePointer> places) {
        super(places);
    }

    @Override
    public boolean isMergeableWith(EdgeFeature<?> other) {
        return false;
    }

    @Override
    public LittleHouse closeEdge(Edge edge) {
        return this;
    }

    @Override
    public Feature placeOnBoard(Position pos, Rotation rot) {
        return new LittleHouse(placeOnBoardPlaces(pos, rot));
    }
}
