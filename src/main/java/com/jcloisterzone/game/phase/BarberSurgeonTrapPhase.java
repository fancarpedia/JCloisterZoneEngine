package com.jcloisterzone.game.phase;

import com.jcloisterzone.Player;
import com.jcloisterzone.action.ConfirmAction;
import com.jcloisterzone.action.MeepleAction;
import com.jcloisterzone.action.PlayerAction;
import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.event.MeepleReturned;
import com.jcloisterzone.feature.*;
import com.jcloisterzone.figure.DeploymentCheckResult;
import com.jcloisterzone.figure.Follower;
import com.jcloisterzone.figure.Meeple;
import com.jcloisterzone.figure.Wagon;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.Rule;
import com.jcloisterzone.game.capability.BarberSurgeonCapability;
import com.jcloisterzone.game.capability.RussianPromosTrapCapability;
import com.jcloisterzone.game.state.ActionsState;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.io.message.CommitMessage;
import com.jcloisterzone.io.message.DeployMeepleMessage;
import com.jcloisterzone.io.message.PassMessage;
import com.jcloisterzone.random.RandomGenerator;
import com.jcloisterzone.reducers.DeployMeeple;
import io.vavr.Tuple2;
import io.vavr.collection.List;
import io.vavr.collection.Queue;
import io.vavr.collection.Set;
import io.vavr.collection.Stream;

public class BarberSurgeonTrapPhase extends Phase {

    public BarberSurgeonTrapPhase(RandomGenerator random, Phase defaultNext) {
        super(random, defaultNext);
    }

    @Override
    public StepResult enter(GameState state) {
        Tuple2<Meeple, FeaturePointer> model = state.getCapabilityModel(BarberSurgeonCapability.class);
        if (model != null) {
        	state.setCapabilityModel(BarberSurgeonCapability.class, null);
        	Meeple meeple = model._1;
        	
        	GameState _state = state;
        	Set<FeaturePointer> emptyBarberSurgeons = state
        			.getFeatures(BarberSurgeon.class)
        			.filter(c -> !c.isOccupied(_state))
        			.map(f -> f.getPlace())
        			.toSet();
        	
        	System.out.println("BG Empty Bads");
        	System.out.println(emptyBarberSurgeons);
        
        	if (emptyBarberSurgeons.size()==1) { // Only one Barber Surgeon is not occupied
        		
        	}
        	if (emptyBarberSurgeons.size()>0) { // More then one Barber Surgeon is not occupied
                MeepleReturned returnedEvent = (MeepleReturned) state.getEvents().findLast(ev -> ev instanceof MeepleReturned).getOrNull();
            	System.out.println("BG MeepleReturned");
            	System.out.println(returnedEvent);
                PlayerAction<?> action = new MeepleAction(meeple, emptyBarberSurgeons, returnedEvent.getFrom());
                state = state.setPlayerActions(
                    new ActionsState(meeple.getPlayer(), action, false)
                );
                return promote(state);
            }
        }
        return next(state);
    }

    @PhaseMessageHandler
    public StepResult handleDeployMeeple(GameState state, DeployMeepleMessage msg) {
        FeaturePointer fp = msg.getPointer();
        Player player = state.getActivePlayer();
        Meeple m = player.getMeepleFromSupply(state, msg.getMeepleId());
        if (!(m instanceof Follower)) {
            throw new IllegalArgumentException("Invalid follower");
        }

        MeepleAction action = (MeepleAction) state.getPlayerActions().getActions().find(a -> a instanceof MeepleAction).get();
        if (action.getOptions().find(p -> fp.equals(p)).isEmpty()) {
            throw new IllegalArgumentException("Invalid placement");
        }

        state = (new DeployMeeple(m, fp)).apply(state);

        return promote(state.setPlayerActions(new ActionsState(player, new ConfirmAction(), false)));
    }

    @PhaseMessageHandler
    public StepResult handleCommit(GameState state, CommitMessage msg) {
        RussianPromosTrapCapability russianPromos = state.getCapabilities().get(RussianPromosTrapCapability.class);
        if (russianPromos != null) {
            state = russianPromos.trapFollowers(state);
        }
        return next(state);
    }
}
