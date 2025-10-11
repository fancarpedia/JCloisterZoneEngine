package com.jcloisterzone.feature;

import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import io.vavr.collection.Stream;

public interface RangeFeature {

    Stream<PlacedTile> getRangeTiles(GameState state);

}
