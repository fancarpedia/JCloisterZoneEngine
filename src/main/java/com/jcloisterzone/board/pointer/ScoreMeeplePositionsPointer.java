package com.jcloisterzone.board.pointer;

import com.jcloisterzone.Immutable;
import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.MeeplePointer;
import com.jcloisterzone.feature.Feature;
import com.jcloisterzone.figure.Meeple;

import io.vavr.collection.Set;
import io.vavr.Tuple2;

/**
 * Points on feature on board or placed meeple.
 */
@Immutable
public class ScoreMeeplePositionsPointer implements BoardPointer {

    private static final long serialVersionUID = 1L;

    private final FeaturePointer featurePointer;
    private final String meepleId;
    private final Set<Position> positions;

    public ScoreMeeplePositionsPointer(FeaturePointer featurePointer, String meepleId, Set<Position> positions) {
        this.featurePointer = featurePointer;
        this.meepleId = meepleId;
        this.positions = positions;
    }

    public FeaturePointer asFeaturePointer() {
        return featurePointer;
    }

    public Position getPosition() {
        return featurePointer.getPosition();
    }

    public Location getLocation() {
        return featurePointer.getLocation();
    }

    public String getMeepleId() {
        return meepleId;
    }

    public Set<Position> getPositions() {
        return positions;
    }

    @Override
    public String toString() {
        return "[x=" + getPosition().x + ",y=" + getPosition().y + "," + getLocation() + "," + this.getMeepleId() + ",positions=" + positions.mkString(",") + "]";
    }
}
