package com.jcloisterzone.game.capability;

import com.jcloisterzone.action.MeepleAction;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.board.pointer.ScoreMeeplePositionsPointer;
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
import com.jcloisterzone.figure.DecinskySneznik;
import com.jcloisterzone.reducers.AddPoints;
import com.jcloisterzone.reducers.UndeployMeeple;
import io.vavr.collection.HashMap;
import io.vavr.collection.HashSet;
import io.vavr.collection.Map;
import io.vavr.collection.Set;
import io.vavr.collection.Stream;
import io.vavr.collection.Vector;
import io.vavr.Tuple2;

public class DecinskySneznikCapability extends Capability<Void> {

	private static final long serialVersionUID = 1L;
	
	private static final int TILES_REQUIRED = 4;

    @Override
    public GameState onActionPhaseEntered(GameState state) {
        ActionsState actions = state.getPlayerActions();

        Position pos = state.getLastPlaced().getPosition();
        
        DecinskySneznik decinskySneznik = (DecinskySneznik) state.getActivePlayer().getMeeplesFromSupply(state, Vector.of(DecinskySneznik.class)).getOrNull();

        if (decinskySneznik != null) {
        	Stream<FeaturePointer> fps = state.getTileFeatures2(pos, Field.class).map(t -> t._1);
	        if (fps.length()>0) {
		        for(FeaturePointer fp: fps) {
		            actions = actions.appendAction(new MeepleAction(decinskySneznik, HashSet.of(fp)));
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
    	Set<DecinskySneznik> deployed = state.getDeployedMeeples()
    	           .filter((m, fp) -> m instanceof DecinskySneznik)
    	           .mapKeys(m -> (DecinskySneznik) m).
    				keySet();
    	
        for(DecinskySneznik decinskySneznik : deployed) {
        	Position position = decinskySneznik.getPosition(state);
        	Set<PlacedTile> places = state.getAdjacentTiles2(position).map(Tuple2::_2).toSet();
        	if (isFinal || (places.length() == TILES_REQUIRED)) {
            	Set<Position> positions = places.map(t -> t.getPosition()).add(position);
            	Integer tiles = places.length() + 1;
        		Integer points = isFinal ? 0 : tiles;
                state = (new AddPoints(new ScoreEvent.ReceivedPoints(new PointsExpression(isFinal ? "decinsky-sneznik.incomplete" : "decinsky-sneznik", new ExprItem(tiles, "tiles", points)), decinskySneznik.getPlayer() , new ScoreMeeplePositionsPointer(decinskySneznik.getDeployment(state), decinskySneznik.getId(), positions)), false)).apply(state);
                if (!isFinal) {
                	state = (new UndeployMeeple(decinskySneznik, false)).apply(state);
                }
            }
        }
        return state;
    	
    }    
}
