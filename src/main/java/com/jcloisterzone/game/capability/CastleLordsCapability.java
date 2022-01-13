package com.jcloisterzone.game.capability;

import com.jcloisterzone.Player;
import com.jcloisterzone.XMLUtils;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Tile;
import com.jcloisterzone.board.TileModifier;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.event.TokenReceivedEvent;
import com.jcloisterzone.event.PlayEvent.PlayEventMeta;
import com.jcloisterzone.event.ScoreEvent.ReceivedPoints;
import com.jcloisterzone.feature.Circus;
import com.jcloisterzone.feature.Road;
import com.jcloisterzone.feature.Scoreable;
import com.jcloisterzone.feature.modifier.BooleanAnyModifier;
import com.jcloisterzone.figure.Follower;
import com.jcloisterzone.figure.Meeple;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.ScoreFeatureReducer;
import com.jcloisterzone.game.capability.GoldminesCapability.GoldToken;
import com.jcloisterzone.game.capability.LittleBuildingsCapability.LittleBuilding;
import com.jcloisterzone.game.state.GameState;

import io.vavr.Tuple2;
import io.vavr.collection.LinkedHashMap;
import io.vavr.collection.List;
import io.vavr.collection.Map;
import io.vavr.collection.Seq;
import io.vavr.collection.Set;
import io.vavr.collection.Vector;

import java.util.Collections;
import java.util.Comparator;
import java.util.Map.Entry;

import org.w3c.dom.Element;

public class CastleLordsCapability extends Capability<Void> {

	private static final long serialVersionUID = 1L;

    @Override
    public List<ReceivedPoints> appendFiguresBonusPoints(GameState state, List<ReceivedPoints> bonusPoints, Scoreable feature, boolean isFinal) {
        if (isFinal || !(feature instanceof Road)) {
            return bonusPoints;
        }
        Road road = (Road) feature;
//System.out.println("Castle lords");
//System.out.println(road.hasModifier(state, Road.CASTLE_LORDS));
        if (!road.hasModifier(state, Road.CASTLE_LORDS)) {
            return bonusPoints;
        }

        // Find Castle Lords Tiles on Road 
        var a = state.getPlacedTiles().filter((pos,pt) -> (road.getTilePositions().contains(pos)));// && pt.getTile().getInitialFeatures().filter((fp,f) -> fp.isPartOf(feature.getPlaces().get()) && ((Road) f).hasModifier(state, Road.CASTLE_LORDS)).size()>0));
System.out.println(a);        
		var b = feature.getPlaces()
			.filter(
				fp -> state.getPlacedTiles()
//						.filter(
//						(pos,pt) -> pt.getTile().getInitialFeatures().filter(
//								(_fp,f) -> _fp.isPartOf(feature.getPlaces().get()/* && f instanceof Road && ((Road) f).hasModifier(state, Road.CASTLE_LORDS)).size()>0) */)
//						).size()
//						)
				.size()>0
			);

        System.out.println(b);        
		
        return bonusPoints;
        /*
        Map<Position, LittleBuilding> buildings = state.getCapabilityModel(LittleBuildingsCapability.class);
        if (buildings == null) {
            return List.empty();
        }
        Set<Position> position = getTilePositions();
        Seq<LittleBuilding> buldingsSeq = buildings.filterKeys(pos -> position.contains(pos)).values();

        getTilePositions
        // If more than one Castle Lord Rile, no bonus
        if >1
        	return bonusPoints;
    	}
    	
    	// When there is at least one meeple not on CastleRoad, then no bonus
    	Check meeples count and meeples on CastleLords tile
    	if !=
    		return bonusPoints;
		}
		
		// All meeples are on CastleLords tile and get's bonus by majority
		
        Position cloisterPosition = monastery.getPlace().getPosition();
        Set<Position> positions = Position.ADJACENT_AND_DIAGONAL.map(pt -> cloisterPosition.add(pt._2)).toSet().add(cloisterPosition);
        Map<Player, LinkedHashMap<Meeple, FeaturePointer>> adjacentMeepleCount = state.getDeployedMeeples()
                .filter(mt -> mt._1 instanceof  Follower)
                .filter(mt -> positions.contains(mt._2.getPosition()))
                .groupBy(mt -> mt._1.getPlayer());
                //.map((p, mts)-> new Tuple2<Player, Integer>(p, mts.size()));
        int max = adjacentMeepleCount.values().map(map -> map.size()).max().getOrElse(-1);
        Set<Player> players = adjacentMeepleCount.filter((p, map) -> map.size() == max).keySet();

        for (Player player: players) {
            LinkedHashMap<Meeple, FeaturePointer> followers = adjacentMeepleCount.get(player).get();
            Tuple2<Meeple, FeaturePointer> onTile = followers.filter(t -> t._2.getPosition().equals(cloisterPosition)).getOrNull();
            FeaturePointer fp;
            if (onTile == null) {
                // if user hasn't follower on monastery itself, use random follower from adjacent tile
                fp = followers.get()._2;
            } else {
                fp = onTile._2;
            }

            PointsExpression expr = new PointsExpression("church", new ExprItem("church", CHURCH_TILES_BONUS));
            bonusPoints = bonusPoints.append(new ReceivedPoints(expr, player, fp));
        }

        return bonusPoints; */
    }
}
