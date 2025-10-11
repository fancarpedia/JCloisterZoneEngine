package com.jcloisterzone.feature;

import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Rotation;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.feature.Road;
import com.jcloisterzone.game.state.GameState;
import io.vavr.collection.HashSet;
import io.vavr.collection.Set;
import io.vavr.collection.List;

public class Marketplace extends TileFeature {

    private static final long serialVersionUID = 1L;

    public static final List<FeaturePointer> INITIAL_PLACE = List.of(new FeaturePointer(Position.ZERO, Marketplace.class, Location.I));

    private Set<FeaturePointer> adjoiningRoads;

    public Marketplace() {
    	super(INITIAL_PLACE);
    	this.adjoiningRoads = HashSet.empty();
    }

    public Marketplace(List<FeaturePointer> places, Set<FeaturePointer> adjoiningRoads) {
        super(places);
        this.adjoiningRoads = adjoiningRoads;
    }

    @Override
    public Feature placeOnBoard(Position pos, Rotation rot) {
        return new Marketplace(placeOnBoardPlaces(pos, rot), placeOnBoardAdjoiningRoads(pos, rot));
    }

    public Set<FeaturePointer> getAdjoiningRoads() {
        return adjoiningRoads;
    }

    public Marketplace setAdjoiningRoads(Set<FeaturePointer> adjoiningRoads) {
        if (this.adjoiningRoads == adjoiningRoads) return this;
        return new Marketplace(places, adjoiningRoads);
    }

    public boolean isOpen(GameState state) {
    	for(FeaturePointer fp: adjoiningRoads) {
			Road road = (Road) state.getFeatureMap()
    			    .get(fp.getPosition())
    			    .flatMap(m -> m.get(fp))
    			    .get();
			if (road.isOpen(state)) {
				return true;
			}
    	}
    	return false;
    }
    
    public Set<FeaturePointer> placeOnBoardAdjoiningRoads(Position pos, Rotation rot) {
        return getAdjoiningRoads().map(fp -> fp.rotateCW(rot).translate(pos));
    }

    public List<Road> getMarketplaceRoads(GameState state) {
    	Set<Road> roads = HashSet.empty();
    	for(FeaturePointer fp: adjoiningRoads) {
			Road road = (Road) state.getFeatureMap()
    			    .get(fp.getPosition())
    			    .flatMap(m -> m.get(fp))
    			    .get();
	        if (!roads.contains(road)) {
	        	roads = roads.add(road);
	        }
    	}
    	return roads.toList();
    }
}
