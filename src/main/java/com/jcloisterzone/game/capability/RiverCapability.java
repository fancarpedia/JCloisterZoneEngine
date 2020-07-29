package com.jcloisterzone.game.capability;

import com.jcloisterzone.board.*;
import com.jcloisterzone.feature.River;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.state.GameState;
import io.vavr.Predicates;
import io.vavr.Tuple2;
import io.vavr.collection.List;


public class RiverCapability extends Capability<Void> {

	private static final long serialVersionUID = 1L;

    @Override
    public GameState onStartGame(GameState state) {
        state = state.mapTilePack(pack -> {
            pack = pack.deactivateGroup("default");
            pack = pack.deactivateGroup("river-lake");
            pack = pack.mapGroup("river", g -> g.setSuccessiveGroup("river-lake"));
            pack = pack.mapGroup("river-lake", g -> g.setSuccessiveGroup("default"));
            if (pack.hasGroup("river-fork")) {
                pack = pack.removeTilesById("R1/I.e"); //remove original lake if River II is enabled
                pack = pack.mapGroup("river-fork", g -> g.setSuccessiveGroup("river"));
                pack = pack.deactivateGroup("river");
            }
            return pack;
        });
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
            .map(l -> l.rotateCW(rot))
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
    }
}