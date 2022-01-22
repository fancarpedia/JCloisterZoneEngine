package com.jcloisterzone.game.phase;

import com.jcloisterzone.Player;
import com.jcloisterzone.action.ReturnMeepleAction;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.board.pointer.MeeplePointer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.event.ScoreEvent.ReceivedPoints;
import com.jcloisterzone.feature.*;
import com.jcloisterzone.figure.Meeple;
import com.jcloisterzone.game.state.ActionsState;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.io.message.ReturnMeepleMessage;
import com.jcloisterzone.io.message.ReturnMeepleMessage.ReturnMeepleSource;
import com.jcloisterzone.random.RandomGenerator;
import com.jcloisterzone.reducers.AddPoints;
import com.jcloisterzone.reducers.UndeployMeeple;

import io.vavr.Tuple2;
import io.vavr.collection.HashSet;
import io.vavr.collection.Vector;

public class BarberSurgeonBuyBackPhase extends Phase {

    public BarberSurgeonBuyBackPhase(RandomGenerator random, Phase defaultNext) {
        super(random, defaultNext);
    }

    @Override
    public StepResult enter(GameState state) {
        HashSet<MeeplePointer> places = HashSet.empty();
        Player active = state.getTurnPlayer();
        for (Tuple2<Meeple, FeaturePointer> t : state.getDeployedMeeples()) {
            Meeple meeple = t._1;
            FeaturePointer fp = t._2;
            Feature feature = state.getFeature(fp);
            if (meeple.getPlayer().equals(active) && (feature instanceof BarberSurgeon)) {
                places = places.add(new MeeplePointer(fp, meeple.getId()));
            }
        }
	    if (!places.isEmpty()){
	        java.util.List actions = java.util.List.of(new ReturnMeepleAction(places, ReturnMeepleMessage.ReturnMeepleSource.BARBER_SURGEON));
	        return promote(state.setPlayerActions(new ActionsState(active, Vector.ofAll(actions), true)));
	    }
    	return next(state);
    }

    @PhaseMessageHandler
    public StepResult handleReturnMeeple(GameState state, ReturnMeepleMessage msg) {
        MeeplePointer ptr = msg.getPointer();

        Meeple meeple = state.getDeployedMeeples().find(m -> ptr.match(m._1)).map(t -> t._1)
            .getOrElseThrow(() -> new IllegalArgumentException("Pointer doesn't match any meeple"));

        if (msg.getSource() != ReturnMeepleSource.BARBER_SURGEON) {
            throw new IllegalArgumentException("Return meeple is not allowed");
        }

        if (meeple.getPlayer() != state.getPlayerActions().getPlayer()) {
            throw new IllegalArgumentException("Not owner");
        }

        ReturnMeepleAction returnAction = (ReturnMeepleAction) state.getAction();
        assert returnAction.getSource() == ReturnMeepleSource.BARBER_SURGEON;
        if (!returnAction.getOptions().contains(ptr)) {
            throw new IllegalArgumentException("Pointer doesn't match action");
        }
        Integer barberSurgeonValue = ((BarberSurgeon) meeple.getFeature(state)).getValue(state);
        PointsExpression expr = new PointsExpression( "barbersurgeon", new ExprItem(1, "buyback", -1 * barberSurgeonValue));
        ReceivedPoints receivedPoints = new ReceivedPoints(expr, meeple.getPlayer(), meeple.getDeployment(state));
        state = (new AddPoints(receivedPoints, false, true)).apply(state);

        state = (new UndeployMeeple(meeple, true)).apply(state);
        state = clearActions(state);
        
        return next(state);
    }
}
