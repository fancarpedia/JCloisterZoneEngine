package com.jcloisterzone.game.capability;

import com.jcloisterzone.action.DonkeyAction;
import com.jcloisterzone.board.PlacementOption;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Rotation;
import com.jcloisterzone.board.Tile;
import com.jcloisterzone.board.pointer.BoardPointer;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.feature.Completable;
import com.jcloisterzone.feature.Feature;
import com.jcloisterzone.feature.River;
import com.jcloisterzone.figure.neutral.Donkey;
import com.jcloisterzone.figure.neutral.Witch;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.Rule;
import com.jcloisterzone.game.capability.trait.FeatureCompletionBlocker;
import com.jcloisterzone.game.state.ActionsState;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.random.RandomGenerator;
import com.jcloisterzone.reducers.MoveNeutralFigure;
import com.jcloisterzone.reducers.PlaceTile;
import io.vavr.collection.List;
import io.vavr.collection.Set;
import io.vavr.collection.Stream;
import io.vavr.Tuple2;

public class DonkeyCapability extends Capability<Void> implements FeatureCompletionBlocker {

    private static final long serialVersionUID = 1L;

    @Override
    public GameState onStartGame(GameState state, RandomGenerator random) {
        state = state.setNeutralFigures(
            state.getNeutralFigures()
                .setDonkey(new Donkey("donkey.1"))
        );
        state = (
            new MoveNeutralFigure<>(state.getNeutralFigures().getDonkey(), new Position(0,0))
        ).apply(state);

        return state;
    }

    @Override
    public boolean isTilePlacementAllowed(GameState state, Tile tile, PlacementOption placement) {
        BoardPointer donkeyPtr = state.getNeutralFigures().getDonkeyDeployment();

        if (donkeyPtr == null) {
        	return true;
        }
        
        Position pos = placement.getPosition();
        Rotation rot = placement.getRotation();

        Integer completedBefore = getCompletedTileFeatures(state, donkeyPtr.getPosition());
        
        state = (new PlaceTile(tile, pos, rot)).apply(state);
        
        Integer completedAfter = getCompletedTileFeatures(state, donkeyPtr.getPosition());

        return completedBefore==completedAfter;
    }

    @Override
    public GameState onActionPhaseEntered(GameState state) {
        ActionsState actions = state.getPlayerActions();

        Donkey donkey = state.getNeutralFigures().getDonkey();

        Set<Position> positions = state.getPlacedTiles().keySet();

        BoardPointer donkeyPtr = state.getNeutralFigures().getDonkeyDeployment();

        if (donkeyPtr != null) {
            positions = positions.filter(fp -> !fp.getPosition().equals(donkeyPtr.getPosition()));
        }
        
        if (donkey != null && positions.size()>0) {
            state = state.appendAction(new DonkeyAction(donkey.getId(), positions));
        }
        return state;
    }
    
    private Integer getCompletedTileFeatures(GameState state, Position pos) {
             
        Integer completed = 0;
        
        for (Tuple2<FeaturePointer, Completable> t : state.getTileFeatures2(pos, Completable.class)) {
        	if (t._2.isCompleted(state)) {
        		if (!(t._2 instanceof River) || state.getBooleanRule(Rule.FISHERMEN)) {
        			completed++;
        		}
            }
        }
        return completed;
    }
    
	public boolean isFeatureCompletionBlocked(GameState state, FeaturePointer fp) {
		Feature f = state.getFeature(fp);

		if (f instanceof Completable c && c.isCompleted(state) && (!(f instanceof River) || state.getBooleanRule(Rule.FISHERMEN))) {
			return c.getTilePositions().contains(state.getNeutralFigures().getDonkeyDeployment().getPosition());
		}
		return false;
	}
}
