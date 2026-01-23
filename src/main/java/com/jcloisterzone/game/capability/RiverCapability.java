package com.jcloisterzone.game.capability;

import com.jcloisterzone.board.*;
import com.jcloisterzone.feature.River;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import com.jcloisterzone.random.RandomGenerator;
import io.vavr.Predicates;
import io.vavr.Tuple2;
import io.vavr.collection.List;

public class RiverCapability extends Capability<Void> {

	private static final long serialVersionUID = 1L;

    @Override
    public GameState onStartGame(GameState state, RandomGenerator random) {
        state = state.mapTilePack(pack -> {
            pack = pack.deactivateGroup("default");
            pack = pack.deactivateGroup("river-lake");
            pack = pack.mapGroup("river", g -> g.setSuccessiveGroup("river-lake"));
            pack = pack.mapGroup("river-lake", g -> g.setSuccessiveGroup("default"));
            if (pack.hasGroup("river-fork")) {
                pack = pack.mapGroup("river-fork", g -> g.setSuccessiveGroup("river"));
                pack = pack.deactivateGroup("river");
            }
            pack = pack.removeGroup("river-spring"); // remove unused springs
            return pack;
        });
        return state;
    }

    @Override
    public GameState onTilePlaced(GameState state, PlacedTile placedTile) {
        if (placedTile.getTile().getId().equals("RI.2/III")) {
            // mix other forks between other river tiles (this is applied when multiple rivers are enabled
            state = state.mapTilePack(pack -> pack.activateGroup("river"));
        }
        return state;
    }

    private boolean isConnectedToPlacedRiver(GameState state, Position pos, Location side) {
        Position adjPos = pos.add(side);
        return state.getPlacedTiles().containsKey(adjPos);
    }

    private boolean isContinuationFree(GameState state, Position pos, Location side) {
        Position adjPos = pos.add(side);
        Position adjPos2 = adjPos.add(side);
        List<Position> reservedTiles = List.of(
            adjPos.add(side.prev()),
            adjPos.add(side.next()),
            adjPos2,
            adjPos2.add(side.prev()),
            adjPos2.add(side.next())
        );
        if (!reservedTiles.find(p -> state.getPlacedTiles().containsKey(p)).isEmpty()) {
        	return false;
        }
        return true;
    }

    @Override
    public boolean isTilePlacementAllowed(GameState state, Tile tile, PlacementOption placement) {
        Position pos = placement.getPosition();
        Rotation rot = placement.getRotation();
        List<Location> riverLocations = tile.getInitialFeatures()
                .filterValues(Predicates.instanceOf(River.class))
                .map(Tuple2::_1)
                .map(fp -> fp.getLocation().rotateCW(rot))
                .toList();

        if (riverLocations.size() == 0) {
            return true;
        }

        boolean foundValidRiverPlacement = false;
        
        for (Location riverLoc : riverLocations) {

            List<Location> sides = riverLoc.splitToSides();
            List<Location> openSides = sides.filter(side -> !isConnectedToPlacedRiver(state, pos, side));
            List<Location> connectedSides = sides.filter(side -> isConnectedToPlacedRiver(state, pos, side));

            int openSidesSize = openSides.size();
            
            if (sides.size() != openSidesSize) {
            	foundValidRiverPlacement = true;

            	if (openSides.filter(side -> isContinuationFree(state, pos, side)).size() != openSidesSize) {
	            	return false;
	            }
            }
        }
        
        return foundValidRiverPlacement;
 
    }
}