package com.jcloisterzone.game.capability;

import com.jcloisterzone.board.*;
import com.jcloisterzone.feature.River;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import com.jcloisterzone.random.RandomGenerator;
import com.jcloisterzone.reducers.PlaceTile;
import io.vavr.Predicates;
import io.vavr.Tuple2;
import io.vavr.collection.LinkedHashMap;
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
    
    private List<Location> getRiverLocations(Tile tile, Rotation rot) {
    	List<Location> riverLocations = tile.getInitialFeatures()
            .filterValues(Predicates.instanceOf(River.class))
            .map(Tuple2::_1)
            .map(fp -> fp.getLocation().rotateCW(rot))
            .toList();

	    return riverLocations;
    }

    private boolean isContinuationFree(GameState state, Position pos, Location side, Tile tile, Rotation rot) {
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
        	// Found regular U-turn
        	return false;
        }
        
        GameState _state = (new PlaceTile(tile, pos, rot)).apply(state);

        LinkedHashMap<Position, PlacedTile> placedTiles = _state.getPlacedTiles();
        
        int minX = 0, maxX = 0, minY = 0, maxY = 0;

        for (Position p : _state.getPlacedTiles().keySet()) {
            int x = p.x;
            int y = p.y;

            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

    	List<Position> check = List.empty();
        
    	if (side.equals(Location.N)) {
			for(int y = minY; y<pos.y; y++) {
	    		check = check.append(new Position(pos.x-1,y));
	    		check = check.append(new Position(pos.x,y));
	    		check = check.append(new Position(pos.x+1,y));
			}
    	} else if (side.equals(Location.E)) {
			for(int x = pos.x+1; x<=maxX; x++) {
				check = check.append(new Position(x,pos.y-1));
				check = check.append(new Position(x,pos.y));
				check = check.append(new Position(x,pos.y+1));
			}
    	} else if (side.equals(Location.S)) {
			for(int y = pos.y+1; y<=maxY; y++) {
	    		check = check.append(new Position(pos.x-1,y));
	    		check = check.append(new Position(pos.x,y));
	    		check = check.append(new Position(pos.x+1,y));
			}
    	} else if (side.equals(Location.W)) {
			for(int x = minX; x<pos.x; x++) {
				check = check.append(new Position(x,pos.y-1));
				check = check.append(new Position(x,pos.y));
				check = check.append(new Position(x,pos.y+1));
			}
		}
		if (check.size()>0 && check.exists(p -> placedTiles.containsKey(p))) {
		    return false;
		}
		
        // Possible future testings
        // TODO: River junction following river curve. Two open neighbouring river branches with same direction
		
		return true;
    }

    @Override
    public boolean isTilePlacementAllowed(GameState state, Tile tile, PlacementOption placement) {
        Position pos = placement.getPosition();
        Rotation rot = placement.getRotation();
        List<Location> riverLocations = getRiverLocations(tile, rot);

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

            	if (openSides.filter(side -> isContinuationFree(state, pos, side, tile, rot)).size() != openSidesSize) {
	            	return false;
	            }
            }
        }
        
        return foundValidRiverPlacement;
 
    }
}