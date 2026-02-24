package com.jcloisterzone.feature;

import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Rotation;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.game.capability.VineyardCapability;
import com.jcloisterzone.game.Rule;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import io.vavr.collection.HashSet;
import io.vavr.collection.List;
import io.vavr.collection.Set;
import io.vavr.collection.Stream;
import io.vavr.Tuple2;
import java.util.ArrayList;

public class Garden extends TileFeature implements Monastic {

    private static final long serialVersionUID = 1L;
    private static final List<FeaturePointer> INITIAL_PLACE = List.of(new FeaturePointer(Position.ZERO, Garden.class, Location.I));

    protected final Set<FeaturePointer> neighboring; //for wagon move

    public Garden() {
        this(INITIAL_PLACE, HashSet.empty());
    }

    public Garden(List<FeaturePointer> places, Set<FeaturePointer> neighboring) {
        super(places);
        this.neighboring = neighboring;
    }

    @Override
    public Set<FeaturePointer> getNeighboring() {
        return neighboring;
    }

    @Override
    public Garden setNeighboring(Set<FeaturePointer> neighboring) {
        if (this.neighboring == neighboring) return this;
        return new Garden(places, neighboring);
    }

    @Override
    public Feature placeOnBoard(Position pos, Rotation rot) {
        return new Garden(placeOnBoardPlaces(pos, rot), placeOnBoardNeighboring(pos, rot));
    }

    @Override
    public PointsExpression getStructurePoints(GameState state, boolean completed) {
    	boolean scoreVineyards = state.hasCapability(VineyardCapability.class) && state.getBooleanRule(Rule.VINEYARDS_FOR_GARDEN);
        Position p = places.get().getPosition();
        int adjacent = 0;
        int adjacentVineyards = 0;
        for (Tuple2<Location, PlacedTile> t : state.getAdjacentAndDiagonalTiles2(p)) {
        	adjacent++;
        	if (scoreVineyards && t._2.getTile().hasModifier(VineyardCapability.VINEYARD)) {
        		adjacentVineyards++;
        	}
        }
        ArrayList<ExprItem> exprItems = new ArrayList<ExprItem>();
        exprItems.add(new ExprItem(adjacent + 1, "tiles", adjacent + 1));

        if (completed && adjacentVineyards > 0) {
            exprItems.add(new ExprItem(adjacentVineyards, "vineyards", adjacentVineyards * 3));
        }
        
        return new PointsExpression(completed ? "garden" : "garden.incomplete",  List.ofAll(exprItems));
    }

    public Stream<PlacedTile> getRangeTiles(GameState state) {
        return state.getAdjacentAndDiagonalTiles2(getPlace().getPosition()).map(Tuple2::_2).append(state.getPlacedTile(getPlace().getPosition()));
    }

    public static String name() {
        return "Garden";
    }
}
