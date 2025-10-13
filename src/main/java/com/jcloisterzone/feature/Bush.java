package com.jcloisterzone.feature;

import com.jcloisterzone.board.Edge;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Rotation;
import com.jcloisterzone.board.pointer.FeaturePointer;
import io.vavr.collection.List;

public class Bush extends TileFeature implements EdgeFeature<Bush> {

    private FeaturePointer adjoiningRoad;

    public Bush(List<FeaturePointer> places, FeaturePointer adjoiningRoad) {
        super(places);
        this.adjoiningRoad = adjoiningRoad;
    }

    @Override
    public boolean isMergeableWith(EdgeFeature<?> other) {
        return false;
    }

    @Override
    public Bush closeEdge(Edge edge) {
        return this;
    }

    @Override
    public Feature placeOnBoard(Position pos, Rotation rot) {
        return new Bush(placeOnBoardPlaces(pos, rot), adjoiningRoad.rotateCW(rot).translate(pos));
    }

    @Override
    public FeaturePointer getProxyTarget() {
        return adjoiningRoad;
    }
}
