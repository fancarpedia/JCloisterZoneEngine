package com.jcloisterzone.board.pointer;

import com.jcloisterzone.Immutable;
import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.BoardPointer;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.feature.Feature;
import com.jcloisterzone.figure.Meeple;

import io.vavr.collection.Set;
import io.vavr.Tuple2;

/**
 * Points on feature on board or placed meeple.
 */
@Immutable
public class ScorePositionsFeaturePointer implements BoardPointer {

    private static final long serialVersionUID = 1L;

    private final FeaturePointer featurePointer;
    private final Set<Position> positions;

    public ScorePositionsFeaturePointer(FeaturePointer featurePointer, Set<Position> positions) {
        this.featurePointer = featurePointer;
        this.positions = positions;
    }

    public FeaturePointer asFeaturePointer() {
        return featurePointer;
    }

    public Position getPosition() {
        return featurePointer.getPosition();
    }

    public Set<Position> getPositions() {
        return positions;
    }

    @Override
    public String toString() {
        return "[x=" + featurePointer.getPosition().x + ",y=" + featurePointer.getPosition().y + "," + featurePointer.getFeature() + "," + featurePointer.getLocation() + "," + "positions=" + positions.mkString(",") + "]";
    }
}
