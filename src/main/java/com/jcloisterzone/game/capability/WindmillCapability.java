package com.jcloisterzone.game.capability;

import com.jcloisterzone.action.MeepleAction;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.game.ScoreFeatureReducer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.event.ScoreEvent;
import com.jcloisterzone.feature.Field;
import com.jcloisterzone.feature.Scoreable;
import com.jcloisterzone.feature.Structure;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.state.ActionsState;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import com.jcloisterzone.figure.Windmill;
import com.jcloisterzone.reducers.AddPoints;
import com.jcloisterzone.reducers.UndeployMeeple;
import io.vavr.collection.HashSet;
import io.vavr.collection.HashMap;
import io.vavr.collection.Map;
import io.vavr.collection.Set;
import io.vavr.collection.Stream;
import io.vavr.collection.Vector;
import io.vavr.Tuple2;

public class WindmillCapability extends Capability<Void> {

	private static final long serialVersionUID = 1L;
	
	private static final int PLUS = 4;

    @Override
    public GameState onActionPhaseEntered(GameState state) {
        ActionsState actions = state.getPlayerActions();

        Position pos = state.getLastPlaced().getPosition();
        
        Windmill windmill = (Windmill) state.getActivePlayer().getMeeplesFromSupply(state, Vector.of(Windmill.class)).getOrNull();

        if (windmill != null) {
        	Stream<FeaturePointer> fps = state.getTileFeatures2(pos, Field.class).map(t -> t._1);
	        if (fps.length()>0) {
		        for(FeaturePointer fp: fps) {
		            actions = actions.appendAction(new MeepleAction(windmill, HashSet.of(fp)));
		        }
		        if (state.getPlayerActions() != actions) {
		            state = state.setPlayerActions(actions.mergeMeepleActions());
		        }
	        }
        }
        return state;
    }

    @Override
    public GameState onFinalScoring(GameState state) {
	    state = score(state, true);
        return state;
    }
    
    @Override
    public GameState onTurnScoring(GameState state, HashMap<Scoreable, ScoreFeatureReducer> completed) {
	    state = score(state, false);
        return state;
    }

    public GameState score(GameState state, Boolean isFinal) {
    	Set<Windmill> deployed = state.getDeployedMeeples()
    	           .filter((m, fp) -> m instanceof Windmill)
    	           .mapKeys(m -> (Windmill) m).
    				keySet();
    	
        int tilesRequired = PLUS;
        
        for(Windmill windmill : deployed) {
        	Position position = windmill.getPosition(state);
        	Set<PlacedTile> t = state.getAdjacentTiles2(position).map(Tuple2::_2).toSet();
        	if (isFinal || (t.length() == tilesRequired)) {
        		Integer tiles = t.length() + 1;
        		Integer points = tiles;
                state = (new AddPoints(new ScoreEvent.ReceivedPoints(new PointsExpression(isFinal ? "windmill.incomplete" : "windmill", new ExprItem(tiles, "tiles", points)), windmill.getPlayer() , windmill.getDeployment(state)), false)).apply(state);
                if (!isFinal) {
                	state = (new UndeployMeeple(windmill, false)).apply(state);
                }
            }
        }
        return state;
    	
    }    
}
