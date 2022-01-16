package com.jcloisterzone.game.capability;

import org.w3c.dom.Element;

import com.jcloisterzone.XMLUtils;
import com.jcloisterzone.board.*;
import com.jcloisterzone.feature.River;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import io.vavr.Predicates;
import io.vavr.Tuple2;
import io.vavr.collection.List;


public class BarberSurgeonCapability extends Capability<Void> {

	private static final long serialVersionUID = 1L;

	public static final TileModifier BARBERSURGEON = new TileModifier("BarberSurgeon");

    @Override
    public Tile initTile(GameState state, Tile tile, Element tileElement) {
        if (!XMLUtils.getElementStreamByTagName(tileElement, "barber-surgeon").isEmpty()) {
        	System.out.println("BarberSurgeon");
        	System.out.println(tile.getId());
            tile = tile.addTileModifier(BARBERSURGEON);
        }
        return tile;
    }

    @Override
    public GameState onStartGame(GameState state) {

//    	List<Tile> barberSurgeonTiles = state.getTilePack().getGroups().toStream().flatMap(t -> t._2.getTiles()).filter(tile -> tile.getInitialFeatures().exists(t -> t._2 instanceof BarberSurgeon)).toList();
    	System.out.println("Remove when initialized BarberSurgeon Feature, remove also tileModifier");
    	List<Tile> barberSurgeonTiles = state.getTilePack().getGroups().toStream().flatMap(t -> t._2.getTiles()).filter(tile -> tile.hasModifier(BARBERSURGEON)).toList();
        
        int playersCount = state.getPlayers().getPlayers().size();
       
        System.out.println("BSTILES COUNT");
        System.out.println(barberSurgeonTiles.size());
        System.out.println("PLAYER COUNT");
        System.out.println(playersCount);
        int removeIndex;
        // Remove all tiles with barber surgeons when count of then is more than count of players + 2
        while ((playersCount + 2) < barberSurgeonTiles.size()) {
//        	removeIndex = state.getPhase().getRandom().getNextInt(barberSurgeonTiles.size());
            System.out.println("Remove index by random");
            removeIndex = 1;
        	state = state.setTilePack(state.getTilePack().removeTilesById(barberSurgeonTiles.get(removeIndex).getId()));
        	barberSurgeonTiles = barberSurgeonTiles.removeAt(removeIndex);
        }
        
        return state;
    }
/*
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
        return reservedTiles.find(p -> state.getPlacedTiles().containsKey(p)).isEmpty();
    }

    @Override
    public boolean isTilePlacementAllowed(GameState state, Tile tile, PlacementOption placement) {
        Position pos = placement.getPosition();
        Rotation rot = placement.getRotation();
        Location riverLoc = tile.getInitialFeatures()
            .filterValues(Predicates.instanceOf(River.class))
            .map(Tuple2::_1)
            .map(fp -> fp.getLocation().rotateCW(rot))
            .getOrNull();

        if (riverLoc == null) {
            return true;
        }

        List<Location> sides = riverLoc.splitToSides();

        List<Location> openSides = sides.filter(side -> !isConnectedToPlacedRiver(state, pos, side));
        if (sides.size() == openSides.size()) {
            return false;
        }

        return !openSides.find(side -> !isContinuationFree(state, pos, side)).isDefined();
    }*/
}