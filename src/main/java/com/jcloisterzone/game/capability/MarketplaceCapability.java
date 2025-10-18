package com.jcloisterzone.game.capability;

import com.jcloisterzone.Player;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.board.pointer.ScorePositionsFeaturePointer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.event.ScoreEvent;
import com.jcloisterzone.event.ScoreEvent.ReceivedPoints;
import com.jcloisterzone.feature.Completable;
import com.jcloisterzone.feature.Marketplace;
import com.jcloisterzone.feature.Scoreable;
import com.jcloisterzone.feature.Road;
import com.jcloisterzone.figure.Follower;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.state.GameState;

import io.vavr.collection.HashSet;
import io.vavr.collection.List;
import io.vavr.collection.Set;
import io.vavr.Tuple2;

import java.util.ArrayList;

public class MarketplaceCapability extends Capability<Void> {

    @Override
    public List<ReceivedPoints> appendFiguresBonusPoints(GameState state, List<ReceivedPoints> bonusPoints, Scoreable feature, boolean isFinal) {
        if (feature instanceof Road && !isFinal) {
        	Road road = (Road) feature;
			Set<Player> owners = road.getOwners(state);
    		Set<FeaturePointer> fps = road.getMarketplaces();
    		if (fps.size()>0 && owners.size()>0) {
    			Integer tiles = 0;
    			Set<Position> positions = HashSet.empty();
    			for(FeaturePointer fp : fps) {
    				Marketplace marketplace = (Marketplace) state.getFeatureMap()
    					.get(fp.getPosition())
        			    .flatMap(m -> m.get(fp))
        			    .get();
            		List<Road> marketplaceRoads = marketplace.getMarketplaceRoads(state);
            		for(Road marketplaceRoad: marketplaceRoads) {
                		Set<Position> roadPositions = marketplaceRoad.getTilePositions();
                		positions = positions.addAll(roadPositions);
//    					if (!road.equals(marketplaceRoads)) {
    						tiles+= roadPositions.size();
//    					}
    				}
    				tiles-= road.getTilePositions().size(); // Exclude scored road tiles
    			}
                ArrayList<ExprItem> exprItems = new ArrayList<ExprItem>();
                ExprItem expr = new ExprItem(tiles, "tiles", tiles);
                for (Player player: owners) {
                    List<Tuple2<Follower, FeaturePointer>> followers = feature.getFollowers2(state).filter(t -> t._1.getPlayer().equals(player)).toList();
                    bonusPoints = bonusPoints.append(new ScoreEvent.ReceivedPoints(new PointsExpression("marketplace", expr), player, new ScorePositionsFeaturePointer(followers.get()._2, positions))); // Positions or Feature pointer
                }
        	}
        }
        return bonusPoints;
    }

}
