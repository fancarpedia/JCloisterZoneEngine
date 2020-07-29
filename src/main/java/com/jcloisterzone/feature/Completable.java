package com.jcloisterzone.feature;

import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.event.play.PointsExpression;
import com.jcloisterzone.game.state.GameState;
import io.vavr.collection.Set;

public interface Completable extends Scoreable {

    boolean isOpen(GameState state);
    default boolean isCompleted(GameState state) {
        return !isOpen(state);
    }

    Completable setNeighboring(Set<FeaturePointer> neighboring);
    Set<FeaturePointer> getNeighboring();

    PointsExpression getPoints(GameState state);

    /** get feature points as completed/incompleted (as is)
     *  and unaffected by Mage or Witch
     */
    PointsExpression getStructurePoints(GameState state, boolean completed);
}
