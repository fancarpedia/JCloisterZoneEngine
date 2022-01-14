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

        if (!road.hasModifier(state, Road.CASTLE_LORDS)) {
            return bonusPoints;
        }
        
        // Get All Castle Lords Tiles on Road
        List<Road> castleLords = feature.getPlaces()
                .map(fp -> {
                     PlacedTile pt = state.getPlacedTile(fp.getPosition());
                     return (Road) pt.getInitialFeaturePartOf(fp.getLocation())._2
                         .placeOnBoard(fp.getPosition(), pt.getRotation());
                }).filter(f -> ((Road) f).hasModifier(state, Road.CASTLE_LORDS));

        // If more than one Castle Lord Tile, no bonus
        if (castleLords.size()>1) {
        	return bonusPoints;
    	}

        Position castleLordPosition = castleLords.get().getPlace().getPosition();
        
        LinkedHashMap<Meeple, FeaturePointer> followers = state.getDeployedMeeples()
                .filter(mt -> mt._1 instanceof  Follower)
                .filter(mt -> mt._1.getPosition(state).equals(castleLordPosition));

        // If meeples are not only on Castle Lord tile, no bonus
        
        if (!castleLords.get().getFollowers(state).equals(feature.getFollowers(state))) {
        	return bonusPoints;
        }
        int size = road.getTilePositions().size();
        
        int castleLordsPoints = (size)*(size-1)/2;

        // Bonus per player, not per meeple
        for (Player player: feature.getOwners(state)) {
        	FeaturePointer fp = followers.filter(t -> t._1.getPlayer().equals(player)).get()._2;
            PointsExpression expr = new PointsExpression("castlelords", new ExprItem("castlelords", castleLordsPoints));
            bonusPoints = bonusPoints.append(new ReceivedPoints(expr, player, fp));
        }

        return bonusPoints;

    }
}
