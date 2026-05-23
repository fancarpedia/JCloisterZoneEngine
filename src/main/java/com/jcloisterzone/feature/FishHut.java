package com.jcloisterzone.feature;

import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Rotation;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.feature.River;
import com.jcloisterzone.game.capability.FishHutsCapability;
import com.jcloisterzone.game.capability.trait.WagonEligible;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;

import io.vavr.Tuple2;
import io.vavr.collection.HashSet;
import io.vavr.collection.List;
import io.vavr.collection.Set;
import io.vavr.collection.Stream;

public class FishHut extends TileFeature implements WagonEligible, Completable, Monastic {
    private static final long serialVersionUID = 1L;

    protected final Set<FeaturePointer> neighboring; //for wagon move

    public FishHut(Location loc) {
        this(List.of(new FeaturePointer(Position.ZERO, FishHut.class, loc)), HashSet.empty());
    }

    public FishHut(List<FeaturePointer> places, Set<FeaturePointer> neighboring) {
        super(places);
        this.neighboring = neighboring;
    }

    @Override
    public FishHut setNeighboring(Set<FeaturePointer> neighboring) {
        if (this.neighboring == neighboring) return this;
        return new FishHut(places, neighboring);
    }

    @Override
    public Set<FeaturePointer> getNeighboring() {
        return neighboring;
    }

    @Override
    public Feature placeOnBoard(Position pos, Rotation rot) {
        return new FishHut(
            placeOnBoardPlaces(pos, rot),
            placeOnBoardNeighboring(pos, rot)
        );
    }

    @Override
    public boolean isOpen(GameState state) {
        return state.getDiagonalTiles2(getPosition()).size() < 4;
    }

    @Override
    public PointsExpression getStructurePoints(GameState state, boolean completed) {
        if (state.getCapabilities().get(FishHutsCapability.class) != null) {
        	return null;
        }

    	if (!completed) {
    		return null;
    	}

    	List<ExprItem> exprItems =  List.of(new ExprItem("fish-hut", 7));

        Position pos = places.get().getPosition();
        int riverTiles = state
        	.getDiagonalTiles(pos)
            .filter(pt -> state.getFeatureMap().get(pt.getPosition()).get().keySet().find(fp -> fp.getFeature().equals(River.class)).isDefined()).length();
        if (riverTiles>0) {
            exprItems = exprItems.append(new ExprItem(riverTiles, "river-tiles", riverTiles * 2));
        }
        return new PointsExpression("fish-hut", exprItems);
    }

    public Stream<PlacedTile> getRangeTiles(GameState state) {
        return state.getDiagonalTiles2(getPosition()).map(Tuple2::_2);
    }

    public static String name() {
        return "Yaga's Hut";
    }
}
