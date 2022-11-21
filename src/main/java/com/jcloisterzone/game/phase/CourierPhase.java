package com.jcloisterzone.game.phase;

import com.jcloisterzone.Player;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.event.MeepleDeployed;
import com.jcloisterzone.event.ScoreEvent;
import com.jcloisterzone.feature.Completable;
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
        
        if (fpCourier.getPosition() != null) {
        	GameState _state = state;
        	
        	List<Tuple2<Meeple, FeaturePointer>> currentDeployedMeeples = state.getDeployedMeeples()
    		.filter(m -> m._1 instanceof Follower)
    		.filter(m -> m._2.getPosition().x == fpCourier.getPosition().x || m._2.getPosition().y == fpCourier.getPosition().y)
    		.filter(m -> Completable.class.isAssignableFrom(m._2.getFeature()))
    		.filter(m -> ((Completable) _state.getFeature(m._2)).isOpen(_state))
    		.toList();

        	MeepleDeployed courierMessageMeeple = List.ofAll(state.getCurrentTurnPartEvents())
            .filter(Predicates.instanceOf(MeepleDeployed.class))
            .map(ev -> (MeepleDeployed) ev)
            .filter(ev -> !(currentDeployedMeeples
            		.filter(m -> m._1.equals(ev.getMeeple()))
            		.empty()))
            .filter(ev -> ev.getPointer().getPosition().x == fpCourier.getPosition().x || ev.getPointer().getPosition().y == fpCourier.getPosition().y)
            .getOrNull();

        	if (courierMessageMeeple != null) {
                state = (
                    new MoveNeutralFigure<>(state.getNeutralFigures().getCourier(), (FeaturePointer) meeple._2)
                ).apply(state);
                System.out.println("Position");
            	System.out.println(state.getNeutralFigures().getCourierDeployment().getPosition());
                Completable feature = (Completable) state.getFeature(meeple._2);
                ScoreEvent.ReceivedPoints points = new ScoreEvent.ReceivedPoints(feature.getPoints(state), meeple._1.getPlayer(), meeple._1.getDeployment(state));
                state = (new AddPoints(points, false)).apply(state);
        	}
        }
		return next(state);
    }

}
