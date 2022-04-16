package com.jcloisterzone.game.capability;

import com.jcloisterzone.Player;
import com.jcloisterzone.XMLUtils;
import com.jcloisterzone.board.Location;
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
import com.jcloisterzone.feature.River;
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
import com.jcloisterzone.game.state.PlacedTile;

import io.vavr.Predicates;
import io.vavr.Tuple;
import io.vavr.Tuple2;
import io.vavr.collection.HashMap;
import io.vavr.collection.HashSet;
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
        	// Skip on final scoring or scored feature is not road
            return bonusPoints;
        }
        if (!((Road) feature).hasModifier(state, Road.CASTLE_LORDS)) {
            return bonusPoints;
        }
        
        // Get All Castles on Road
        Set<FeaturePointer> castles = feature.getPlaces()
            .map(fp -> {
                 PlacedTile pt = state.getPlacedTile(fp.getPosition());
                 return (Road) pt.getInitialFeaturePartOf(fp.getLocation())._2
                     .placeOnBoard(fp.getPosition(), pt.getRotation());
            }).filter(f -> ((Road) f).hasModifier(state, Road.CASTLE_LORDS))
            .map(f -> f.getPlaces().get())
            .toSet();

    	LinkedHashMap<Meeple, FeaturePointer> castleLords = state.getDeployedMeeples()
            .filter(mt -> mt._1 instanceof  Follower)
            .filter(mt -> feature.getOwners(state).contains(mt._1.getPlayer()))
            .filter(mt -> castles.contains(mt._2));

    	// No Castle Lords Meeple
    	if (castleLords.size()==0) {
    		return bonusPoints;
    	}

    	int size = feature.getTilePositions().size();
        int castleLordsPoints = (size)*(size-1)/2;
        PointsExpression expr = new PointsExpression("castle-lords", new ExprItem("castle-lords", castleLordsPoints));
        
        for (Player player: feature.getOwners(state)) {
        	FeaturePointer fp = castleLords.filter(t -> t._1.getPlayer().equals(player)).map(t -> t._2).getOrNull();
        	if (fp != null) {
        		bonusPoints = bonusPoints.append(new ReceivedPoints(expr, player, fp));
        	}
        }
        return bonusPoints;
    }
}
