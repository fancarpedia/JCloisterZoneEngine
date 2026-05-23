package com.jcloisterzone.feature;

import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import io.vavr.collection.Stream;

public interface RangeFeature extends Feature {

    Stream<PlacedTile> getRangeTiles(GameState state);
    
    default Stream<PlacedTile> getRangeTilesWithFeature(GameState state) {
        Stream<PlacedTile> featureTiles = getPlaces()
            .toStream()
            .map(fp -> fp.getPosition())
            .distinct()
            .map(pos -> state.getPlacedTiles().get(pos))
            .flatMap(opt -> opt.toStream());

        return getRangeTiles(state).appendAll(featureTiles);
    }

}
