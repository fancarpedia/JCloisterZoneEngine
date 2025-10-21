package com.jcloisterzone.game.capability;

import com.jcloisterzone.Player;
import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.board.pointer.ScoreMeeplePositionsPointer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.event.ScoreEvent;
import com.jcloisterzone.event.ScoreEvent.ReceivedPoints;
import com.jcloisterzone.feature.City;
import com.jcloisterzone.feature.CompletableFeature;
import com.jcloisterzone.feature.Field;
import com.jcloisterzone.feature.RangeFeature;
import com.jcloisterzone.feature.Road;
import com.jcloisterzone.feature.Feature;
import com.jcloisterzone.feature.Monastery;
import com.jcloisterzone.feature.Scoreable;
import com.jcloisterzone.figure.Follower;
import com.jcloisterzone.figure.Meeple;
import com.jcloisterzone.figure.RangeFigure;
import com.jcloisterzone.figure.Special;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.capability.trait.FlowersBonusAffected;
import com.jcloisterzone.game.ScoreFeatureReducer;
import com.jcloisterzone.game.Token;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import com.jcloisterzone.game.state.PlayersState;
import com.jcloisterzone.game.token.FlowersToken;
import com.jcloisterzone.random.RandomGenerator;
import com.jcloisterzone.reducers.AddPoints;
import io.vavr.collection.HashMap;
import io.vavr.collection.HashSet;
import io.vavr.collection.List;
import io.vavr.collection.Map;
import io.vavr.collection.Set;
import io.vavr.collection.Stream;
import io.vavr.Tuple2;
import java.util.ArrayList;

public class FlowersCapability extends Capability<Void> {

    private static final long serialVersionUID = 1L;

    @Override
    public GameState onStartGame(GameState state, RandomGenerator random) {
        PlayersState ps = state.getPlayers();
        int multiplier = (int) Math.ceil(ps.getPlayers().size() / 4.0); // 1 for 1–4 players, 2 for 5–8, etc.

        List<FlowersToken> pool = List.empty();
        for (int i = 0; i < multiplier; i++) {
            pool = pool.appendAll(List.of(FlowersToken.values()));
        }

        for (Player p : ps.getPlayers()) {
            int idx = random.getNextInt(pool.size());
            FlowersToken token = pool.get(idx);
            pool = pool.removeAt(idx);
            ps = ps.setTokenCount(p.getIndex(), token, 1);
        }

        return state.setPlayers(ps);
    }

    @Override
    public List<ReceivedPoints> appendFiguresBonusPoints(GameState state, List<ReceivedPoints> bonusPoints, Scoreable feature, boolean isFinal) {
        Map<String,Integer> featureFlowers = HashMap.empty();

        Stream<PlacedTile> tiles = Stream.empty();
        if (feature instanceof Field field && isFinal) {
            featureFlowers = field.getModifier(state, Field.FLOWERS, HashMap.empty() );
        	tiles = field
    		            .getTilePositions()
    		            .map(pos -> state.getPlacedTiles().get(pos).get()).toStream();
        } else if (feature instanceof FlowersBonusAffected) {
            if (feature instanceof Monastery) {
                if (((Monastery) feature).isSpecialMonastery(state)) {
                    if (isFinal) {
                        tiles = ((Monastery) feature).getRangeTilesSpecialMonastery(state);
                    }
                } else {
                    tiles = ((Monastery) feature).getRangeTiles(state);
                }
            } else if (feature instanceof RangeFeature) {
                tiles = ((RangeFeature) feature).getRangeTiles(state);
            } else if (feature instanceof CompletableFeature){
            	tiles = ((CompletableFeature) feature)
            		        .getTilePositions()
            		        .map(pos -> state.getPlacedTiles().get(pos).get()).toStream();
            } else {
                throw new IllegalArgumentException("Unknown feature type for FlowersBonus " + feature);
            }
            featureFlowers = getFlowersOnTiles(state, tiles);
        }
        
        if (!featureFlowers.isEmpty()) {
            Stream<Follower> followers = (
                feature instanceof Monastery monastery && monastery.isSpecialMonastery(state)
                    ? Stream.ofAll(monastery.getMonasteryFollowers2(state)).map(Tuple2::_1)
                    : Stream.ofAll(feature.getFollowers(state))
                ).distinctBy(Follower::getPlayer);

            bonusPoints = appendBonusPoints(state, bonusPoints, featureFlowers, followers.map(Meeple.class::cast), tiles.map(t -> t.getPosition()).toSet());
        }
        return bonusPoints;
    }
    
    @Override
    public List<ReceivedPoints> appendSpecialFiguresBonusPoints(GameState state, List<ReceivedPoints> bonusPoints, Special figure, boolean isFinal) {
        Stream<PlacedTile> tiles = Stream.empty();
           if (figure instanceof FlowersBonusAffected) {
               tiles = ((RangeFigure) figure).getRangeTiles(state);
        }
        Map<String,Integer> flowersInRange = getFlowersOnTiles(state, tiles);
        bonusPoints = appendBonusPoints(state, bonusPoints, flowersInRange, Stream.of((Meeple) figure), tiles.map(PlacedTile::getPosition).toSet());
        return bonusPoints;
    }
    
    private Map<String,Integer> getFlowersOnTiles(GameState state, Stream<PlacedTile> tiles) {
        Map<String,Integer> flowers = HashMap.empty();
        for (PlacedTile t : tiles) {
            Map<FeaturePointer, Field> fields =
                t.getTile().getInitialFeatures()
                    .filterValues(f -> f instanceof Field)
                    .mapValues(f -> (Field) f);

            for (Tuple2<FeaturePointer, Field> fieldEntry : fields) {
                Map<String,Integer> fieldFlowers = fieldEntry._2.getModifier(state, Field.FLOWERS, HashMap.empty());
                flowers = flowers.merge(fieldFlowers, (a, b) -> a + b);
            }
        }
        return flowers;
    }
    
    private List<ReceivedPoints> appendBonusPoints(GameState state, List<ReceivedPoints> bonusPoints, Map<String,Integer> flowersList, Stream<Meeple> figures, Set<Position> positions) {
        if (figures.size()>0) {
//            Stream<Player> players = figures
//                    .flatMap(f -> f instanceof Follower ? Stream.of(((Follower) f).getPlayer())
//                               : f instanceof Special ? Stream.of(((Special) f).getPlayer())
//                               : Stream.empty());
//            Stream<Player> players = figures.map(Follower::getPlayer);
            PlayersState ps = state.getPlayers();
    
            HashMap<Token,Set<Player>> tokenPlayers = HashMap.empty();
            for(Token token: FlowersToken.values()) {
                tokenPlayers = tokenPlayers.put(token, ps.getPlayersWithToken(token));
            }
    
            for(Tuple2<String, Integer> flowers : flowersList) {
                Token token = FlowersToken.fromValue(flowers._1);
                for (Tuple2<Token,Set<Player>> p: tokenPlayers) {
                    ArrayList<ExprItem> exprItems = new ArrayList<ExprItem>();
                    if (token.equals(p._1)) {
                        ExprItem expr = new ExprItem(flowers._2, "flowers." + token.name(), 3 * flowers._2);
                        for (Player player: p._2) {
                            bonusPoints = bonusPoints.appendAll(
                                figures
                                    .filter(f -> f.getPlayer().equals(player))
                                    .map(f -> new ScoreEvent.ReceivedPoints(new PointsExpression("flowers", expr), player, new ScoreMeeplePositionsPointer(f.getDeployment(state), f.getId(), positions)))
                            );
//                            if (players.contains(player)) {
//                                bonusPoints = bonusPoints.append(new ScoreEvent.ReceivedPoints(new PointsExpression("flowers", expr), player, new MeeplePointer(fps.get(), positions)));
//                            }
                        }
                    }
                }
            }
        }
        return bonusPoints;
    }
}
