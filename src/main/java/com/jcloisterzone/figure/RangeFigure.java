package com.jcloisterzone.figure;

import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import io.vavr.collection.Stream;

public interface RangeFigure {

    Stream<PlacedTile> getRangeTiles(GameState state);

}
