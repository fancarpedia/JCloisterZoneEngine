package com.jcloisterzone.game.capability;

import com.jcloisterzone.Player;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PlayEvent.PlayEventMeta;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.event.ScoreEvent.ReceivedPoints;
import com.jcloisterzone.event.TokenReceivedEvent;
import com.jcloisterzone.feature.Completable;
import com.jcloisterzone.feature.Road;
import com.jcloisterzone.feature.Scoreable;
import com.jcloisterzone.game.BiggestFeatureAward;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.Rule;
import com.jcloisterzone.game.ScoreFeatureReducer;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.MemoizedValue;
import com.jcloisterzone.game.state.PlayersState;
import com.jcloisterzone.random.RandomGenerator;
import com.jcloisterzone.reducers.AddPoints;
import io.vavr.collection.HashMap;
import io.vavr.collection.HashSet;
import io.vavr.collection.Set;
import io.vavr.Tuple2;

/**
 * @model Tuple2<FeaturePointer,Integer> : largest road with it's size when completed
 */
public final class RobberCapability extends Capability<Tuple2<FeaturePointer,Integer>> {

    @Override
    public GameState onStartGame(GameState state, RandomGenerator random) {
        state = setModel(state, new Tuple2(null, 0));
        return state;
    }

    @Override
    public GameState onTurnScoring(GameState state, HashMap<Scoreable, ScoreFeatureReducer> completed) {
        Set<Scoreable> completedFeatures = completed.keySet();
        int completedRoadsThisTurn = 0;
        int maxRoadSize = getModel(state)._2;
        Road longestRoadCompleted = null;

        for (Scoreable feature : completed.keySet()) {
            if (feature instanceof Road) {
                completedRoadsThisTurn++;
                int roadSize = feature.getTilePositions().size();
                if (roadSize > maxRoadSize) {
                	maxRoadSize = roadSize;
                    longestRoadCompleted = (Road) feature;
                }
            }
        }

        if (state.getStringRule(Rule.KING_AND_ROBBER_SCORING).equals("continuously") && completedRoadsThisTurn > 0) {
            Player currentHolder = state.getPlayers().getPlayerWithToken(BiggestFeatureAward.ROBBER);
            if (currentHolder != null) {
                ReceivedPoints rp = new ReceivedPoints(new PointsExpression("robber", new ExprItem(completedRoadsThisTurn, "roads", completedRoadsThisTurn)), currentHolder, null);
                state = (new AddPoints(rp, false)).apply(state);
            }
        }

        Player turnPlayer = state.getTurnPlayer();
        PlayersState ps = state.getPlayers();
        if (longestRoadCompleted != null) {
            state = setModel(state, new Tuple2(state.getFeaturePointer(longestRoadCompleted), longestRoadCompleted.getTilePositions().size()));

            for (Player p : ps.getPlayers()) {
                ps = ps.setTokenCount(p.getIndex(), BiggestFeatureAward.ROBBER, p.equals(turnPlayer) ? 1 : 0);
            }
            TokenReceivedEvent ev = new TokenReceivedEvent(
                    PlayEventMeta.createWithActivePlayer(state), turnPlayer, BiggestFeatureAward.ROBBER, 1);
            ev.setSourceFeature(longestRoadCompleted);
            state = state.appendEvent(ev);
        }
        return state.setPlayers(ps);
    }

    @Override
    public GameState onFinalScoring(GameState state) {
        PlayersState ps = state.getPlayers();
        String rule = state.getStringRule(Rule.KING_AND_ROBBER_SCORING);
        if (rule.equals("continuously")) {
            return state;
        }

        Player player = ps.getPlayerWithToken(BiggestFeatureAward.ROBBER);
        if (player == null) {
            return state;
        }

        String itemName = "robber";
        Integer count = null;
        int points;
        if (rule.equals("10/20")) {
            points = 10;
        } else if (rule.equals("15/40")) {
            boolean hasAlsoKing = ps.getPlayerTokenCount(player.getIndex(), BiggestFeatureAward.KING) > 0;
            if (hasAlsoKing) {
                // this is awarded from KingCapability
                return state;
            } else {
                points = 15;
            }
        } else {
            itemName = "roads";
            points = countCompletedRoads(state);
            count = points;
        }
        ReceivedPoints rp = new ReceivedPoints(new PointsExpression("robber", new ExprItem(count, itemName, points)), player, null);
        state = (new AddPoints(rp, false, true)).apply(state);
        return state;
    }

    private int getMaxSize(GameState state, Class<? extends Completable> cls, Set<Scoreable> exclude) {
        return state.getFeatures(cls)
            .filter(c -> !exclude.contains(c))
            .filter(c -> c.isCompleted(state))
            .map(c -> c.getTilePositions().size())
            .max()
            .getOrElse(0);
    }

    public int countCompletedRoads(GameState state) {
        return state.getFeatures(Road.class)
            .filter(c -> c.isCompleted(state))
            .size();
    }

    private MemoizedValue<Integer> _getLongestRoadSize = new MemoizedValue<>(state -> getMaxSize(state, Road.class, HashSet.empty()));

    public int getLongestRoadSize(GameState state) {
        return _getLongestRoadSize.apply(state);
    }
}

