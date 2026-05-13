package com.jcloisterzone.game.phase;

import com.jcloisterzone.Player;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.event.MeepleDeployed;
import com.jcloisterzone.event.ScoreEvent;
import com.jcloisterzone.feature.Completable;
import com.jcloisterzone.feature.Feature;
import com.jcloisterzone.feature.Monastery;
import com.jcloisterzone.feature.Scoreable;
import com.jcloisterzone.figure.Follower;
import com.jcloisterzone.figure.Meeple;
import com.jcloisterzone.figure.neutral.Courier;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import com.jcloisterzone.random.RandomGenerator;
import com.jcloisterzone.reducers.AddPoints;
import com.jcloisterzone.reducers.MoveNeutralFigure;

import io.vavr.Predicates;
import io.vavr.Tuple2;
import io.vavr.collection.List;
import io.vavr.collection.Stream;

public class CourierPhase extends Phase {

    public CourierPhase(RandomGenerator random, Phase defaultNext) {
        super(random, defaultNext);
    }

    @Override
    public StepResult enter(GameState state) {
        FeaturePointer fpCourier = state.getNeutralFigures().getCourierDeployment();
        
        if (fpCourier != null && fpCourier.getPosition() != null) {
        	GameState _state = state;
        	
        	List<Tuple2<Meeple, FeaturePointer>> currentDeployedMeeples = state.getDeployedMeeples()
	    		.filter(m -> m._1 instanceof Follower)
	    		.filter(m -> m._2.getPosition().x == fpCourier.getPosition().x || m._2.getPosition().y == fpCourier.getPosition().y)
	    		.toList();

        	MeepleDeployed courierMessageMeeple = List.ofAll(state.getCurrentTurnPartEvents())
	            .filter(Predicates.instanceOf(MeepleDeployed.class))
	            .map(ev -> (MeepleDeployed) ev)
	            .filter(ev -> currentDeployedMeeples
            		.filter(m -> m._1.equals(ev.getMeeple()) && m._2.equals(ev.getPointer()))
            		.nonEmpty())
	            .filter(ev -> ev.getPointer().getPosition().x == fpCourier.getPosition().x || ev.getPointer().getPosition().y == fpCourier.getPosition().y)
	            .getOrNull();

        	if (courierMessageMeeple != null) {
                state = (
                    new MoveNeutralFigure<>(state.getNeutralFigures().getCourier(), courierMessageMeeple.getPointer())
                ).apply(state);
            	
            	Position pos = courierMessageMeeple.getPointer().getPosition();
            	
            	List<Tuple2<Meeple, FeaturePointer>> affectedMeeples = state.getDeployedMeeples().filter((m, fp) -> {
                    if (!(m instanceof Follower)) return false;
                    Feature f = _state.getFeature(fp);
                    if (!(f instanceof Completable)) return false;
                    if ((f instanceof Monastery) && (((Monastery) f).isSpecialMonastery(_state))) return false;
                    Position mpos = fp.getPosition();
                    return Math.abs(pos.x - mpos.x) <= 1 && Math.abs(pos.y - mpos.y) <= 1;
                })
    			.toList()
    		    .foldLeft(
    		        List.<Tuple2<Meeple, FeaturePointer>>empty(),
    		        (acc, t) -> acc.exists(existing -> t._2().isPartOf(existing._2()) || existing._2().isPartOf(t._2()))
    		            ? acc
    		            : acc.append(t)
    		    );

            	for (Tuple2<Meeple, FeaturePointer> affectedMeeple: affectedMeeples) {
            		Completable feature = (Completable) state.getFeature(affectedMeeple._2);
            		ScoreEvent.ReceivedPoints points = new ScoreEvent.ReceivedPoints(feature.getPoints(state), courierMessageMeeple.getMeeple().getPlayer(), affectedMeeple._1.getDeployment(state));
            		state = (new AddPoints(points, false)).apply(state);
            	}
        	}
        }
		return next(state);
    }

}
