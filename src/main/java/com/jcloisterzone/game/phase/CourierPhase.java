package com.jcloisterzone.game.phase;

import com.jcloisterzone.Player;
import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.board.pointer.MeeplePointer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.CastleCreated;
import com.jcloisterzone.event.MeepleDeployed;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.event.ScoreEvent;
import com.jcloisterzone.feature.Castle;
import com.jcloisterzone.feature.Completable;
import com.jcloisterzone.feature.Feature;
import com.jcloisterzone.feature.Monastery;
import com.jcloisterzone.feature.Scoreable;
import com.jcloisterzone.figure.Follower;
import com.jcloisterzone.figure.Meeple;
import com.jcloisterzone.figure.neutral.Courier;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.random.RandomGenerator;
import com.jcloisterzone.reducers.AddPoints;
import com.jcloisterzone.reducers.MoveNeutralFigure;

import io.vavr.Predicates;
import io.vavr.Tuple2;
import io.vavr.collection.Array;
import io.vavr.collection.HashSet;
import io.vavr.collection.List;
import io.vavr.collection.Set;
import io.vavr.collection.Stream;
import io.vavr.control.Option;

public class CourierPhase extends Phase {

    public CourierPhase(RandomGenerator random, Phase defaultNext) {
        super(random, defaultNext);
    }

    @Override
    public StepResult enter(GameState state) {
        FeaturePointer fpCourier = state.getNeutralFigures().getCourierDeployment();
        if (fpCourier == null || fpCourier.getPosition() == null) {
            return next(state);
        }

        GameState _state = state;

        Set<Location> restrictedQuarters = HashSet.of(
      	    Location.QUARTER_CASTLE, 
       	    Location.QUARTER_MARKET, 
       	    Location.QUARTER_BLACKSMITH, 
       	    Location.QUARTER_CATHEDRAL
       	);
        
        List<MeepleDeployed> deployedThisTurn = List.ofAll(state.getCurrentTurnPartEvents())
       	    .filter(Predicates.instanceOf(MeepleDeployed.class))
       	    .map(ev -> (MeepleDeployed) ev)
       	    .filter(ev -> (ev.getMeeple() instanceof Follower))
       	    .filter(ev -> !restrictedQuarters.contains(ev.getLocation()));
        
        boolean castleCreatedThisTurn = List.ofAll(state.getCurrentTurnPartEvents())
            .exists(Predicates.instanceOf(CastleCreated.class));

        // Meeples moved to a Castle this turn and still deployed there
        List<MeepleDeployed> castleEvents = castleCreatedThisTurn
            ? deployedThisTurn.filter(ev ->
                ev.getMovedFrom() != null
                && ((FeaturePointer) ev.getPointer()).getFeature().equals(Castle.class)
                && _state.getDeployedMeeples().get(ev.getMeeple())
                         .map(ev.getPointer()::equals).getOrElse(false))
            : List.empty();

        MeepleDeployed meepleForCourierMessage = deployedThisTurn
            .flatMap(ev -> {
                Meeple m = ev.getMeeple();
                FeaturePointer currentFp = _state.getDeployedMeeples().get(m).getOrNull();
                if (currentFp == null) return List.empty();
                if (!meepleOrthogonallyAlignedToCourier(_state, new Tuple2<>(m, currentFp), fpCourier)) return List.empty();
                // Still at original deployment position
                if (currentFp.equals(ev.getPointer())) return List.of(ev);
                // Promoted to castle lord this turn
                return castleEvents.filter(mev -> mev.getMeeple().equals(m)).take(1);
            })
            .headOption()
            .getOrNull();

        if (meepleForCourierMessage == null) {
            return next(state);
        }

        state = new MoveNeutralFigure<>(
            state.getNeutralFigures().getCourier(),
            meepleForCourierMessage.getPointer()
        ).apply(state);

        Position pos = meepleForCourierMessage.getPointer().getPosition();
        Feature courierFeature = state.getFeature((FeaturePointer) meepleForCourierMessage.getPointer());

        List<Tuple2<Meeple, FeaturePointer>> affectedMeeples = state.getDeployedMeeples()
            .filter((m, fp) -> {
                if (!(m instanceof Follower)) return false;
                Feature f = _state.getFeature(fp);
                if (!(f instanceof Completable)) return false;
                if (f instanceof Monastery && ((Monastery) f).isSpecialMonastery(_state)) return false;
                Position mpos = fp.getPosition();
                if (courierFeature instanceof Castle) {
                    return ((Castle) courierFeature).getVicinity().contains(mpos);
                }
                return Math.abs(pos.x - mpos.x) <= 1 && Math.abs(pos.y - mpos.y) <= 1;
            })
            .toList()
            .distinctBy(t -> _state.getFeature(t._2()));

        for (Tuple2<Meeple, FeaturePointer> affected : affectedMeeples) {
            Completable feature = (Completable) state.getFeature(affected._2);
            PointsExpression expr = feature.getPoints(state);
            ScoreEvent.ReceivedPoints points = new ScoreEvent.ReceivedPoints(
                new PointsExpression("courier." + expr.getName(), expr.getItems()),
                meepleForCourierMessage.getMeeple().getPlayer(),
                affected._1.getDeployment(state)
            );
            state = new AddPoints(points, false).apply(state);
        }

        return next(state);
    }

    private Set<Position> featurePositions(GameState state, FeaturePointer fp) {
        Feature feature = state.getFeature(fp);
        if (feature instanceof Castle) {
            return HashSet.ofAll(((Castle) feature).getPlaces().map(FeaturePointer::getPosition));
        }
        return HashSet.of(fp.getPosition());
    }

    boolean meepleOrthogonallyAlignedToCourier(
            GameState state,
            Tuple2<Meeple, FeaturePointer> meeple,
            FeaturePointer courier) {
        Set<Position> meeplePos  = featurePositions(state, meeple._2);
        Set<Position> courierPos = featurePositions(state, courier);
        return meeplePos.exists(mp -> courierPos.exists(cp -> mp.x == cp.x || mp.y == cp.y));
    }
}