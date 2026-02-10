package com.jcloisterzone.game.capability;

import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.TileModifier;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.board.pointer.ScoreMeeplePositionsPointer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.event.ScoreEvent;
import com.jcloisterzone.event.ScoreEvent.ReceivedPoints;
import com.jcloisterzone.feature.*;
import com.jcloisterzone.figure.Follower;
import com.jcloisterzone.figure.Meeple;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import com.jcloisterzone.reducers.AddPoints;

import io.vavr.Predicates;
import io.vavr.Tuple2;
import io.vavr.collection.List;
import io.vavr.collection.Set;
import io.vavr.collection.Stream;

import java.util.ArrayList;

public class WatchtowerCapability  extends Capability<Void> {

    public static class WatchtowerModifier extends TileModifier {
        private int points;
        private String subject;

        public WatchtowerModifier(String type) {
            super("Watchtower:" + type);
            String[] tokens = type.split("/", 2);
            this.points = Integer.parseInt(tokens[0]);
            this.subject = tokens[1];
        }
    }

    @Override
    public GameState beforeCompletableScore(GameState state, java.util.Set<Completable> features) {
        java.util.Map<Position, WatchtowerModifier> watchtowers = new java.util.HashMap<>();
        java.util.Map<Position, java.util.List<Tuple2<Meeple, FeaturePointer>>> watchtowerMeeples = new java.util.HashMap<>();

        state.getPlacedTiles().forEach((pos, pt) -> {
            pt.getTile().getTileModifiers().filter(Predicates.instanceOf(WatchtowerModifier.class)).forEach(mod -> {
                watchtowers.put(pos, (WatchtowerModifier) mod);
            });
        });

        if (watchtowers.isEmpty()) {
            return state;
        }

        for (Tuple2<Meeple, FeaturePointer> t : state.getDeployedMeeples()) {
            FeaturePointer fp = t._2;
            if (!watchtowers.containsKey(fp.getPosition())) {
                continue;
            }

            if (features.stream().filter(f -> f.getPlaces().contains(fp)).findAny().isPresent()) {
            	java.util.List<Tuple2<Meeple, FeaturePointer>> meeples = watchtowerMeeples.get(fp.getPosition());
                if (meeples == null) {
                    meeples = new ArrayList<>();
                    watchtowerMeeples.put(fp.getPosition(), meeples);
                }
                meeples.add(t);
            }
        }

        for (java.util.Map.Entry<Position, java.util.List<Tuple2<Meeple, FeaturePointer>>> entry : watchtowerMeeples.entrySet()) {
            Position pos = entry.getKey();
            WatchtowerModifier watchtower = watchtowers.get(pos);
            int count = 0;
            String exprName = null;

            GameState _state = state;
        	Stream<PlacedTile> pts = _state
                	.getAdjacentAndDiagonalTiles(pos)
                	.append(_state.getPlacedTile(pos));
        	
        	Set<Position> positions = pts.map(t -> t.getPosition()).toSet();

        	switch (watchtower.subject) {
                case "coat-of-arms":
                	for(PlacedTile pt: pts) {
                	  for (Feature f: pt.getTile().getInitialFeatures().values()) {
                        if (f instanceof City) {
                           	FeaturePointer fp = ((City) f).getPlaces().get().setPosition(pt.getPosition()).rotateCW(pt.getRotation());
                            if (!((City) _state.getFeature(fp)).hasModifier(_state, City.ELIMINATED_PENNANTS)) {
                              count+=((City) f).getModifier(_state, City.PENNANTS, 0);
                            }
                        }
                      }
                	}
                    exprName = "pennants";
                    break;
                case "monastery":
                    count = getNeigbouringFeatures(state, pos).filter(Predicates.instanceOf(Monastery.class)).length();
                    exprName = "monasteries";
                    break;
                case "city":
                    count = getNeigbouring(state, pos).filter(pt -> _state.getFeatureMap().get(pt.getPosition()).get().keySet().find(fp -> fp.getFeature().equals(City.class)).isDefined()).length();
                    exprName = "cities";
                    break;
                case "road":
                    count = getNeigbouring(state, pos).filter(pt -> _state.getFeatureMap().get(pt.getPosition()).get().keySet().find(fp -> fp.getFeature().equals(Road.class)).isDefined()).length();
                    exprName = "roads";
                    break;
                case "meeple":
                    count = state.getDeployedMeeples().filter((m, fp) -> {
                        if (!(m instanceof Follower)) return false;
                        Position mpos = fp.getPosition();
                        return Math.abs(pos.x - mpos.x) <= 1 && Math.abs(pos.y - mpos.y) <= 1;
                    }).length();
                    exprName = "meeples";
            }

            if (count > 0) {
                PointsExpression expr = new PointsExpression("watchtower", new ExprItem(count, exprName, count * watchtower.points));
                List<ReceivedPoints> receivedPoints = List.ofAll(entry.getValue()).map(t -> new ScoreEvent.ReceivedPoints(expr, t._1.getPlayer(), new ScoreMeeplePositionsPointer(t._1.getDeployment(_state), t._1.getId(), positions)));
                state = (new AddPoints(receivedPoints, true)).apply(state);
            }
        }

        return state;
    }

    private Stream<PlacedTile> getNeigbouring(GameState state, Position pos) {
        return state
                .getAdjacentAndDiagonalTiles(pos)
                .append(state.getPlacedTile(pos));
    }

    private Stream<Feature> getNeigbouringFeatures(GameState state, Position pos) {
        return getNeigbouring(state, pos).flatMap(pt -> pt.getTile().getInitialFeatures().values());
    }
}
