package com.jcloisterzone.figure;

import com.jcloisterzone.Player;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.feature.Field;
import com.jcloisterzone.feature.Structure;
import com.jcloisterzone.figure.RangeFigure;
import com.jcloisterzone.game.capability.trait.FlowersBonusAffected;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import io.vavr.collection.Stream;
import io.vavr.Tuple2;

public class DecinskySneznik extends Special implements FlowersBonusAffected, RangeFigure {

    private static final long serialVersionUID = 1L;

    public DecinskySneznik(String id, Player player) {
        super(id, player);
    }

    @Override
    public boolean canBeEatenByDragon(GameState state) {
        return false;
    }

    @Override
    public boolean interactingWithOtherMeeples() {
    	return false;
    }
    
    @Override
    public DeploymentCheckResult isDeploymentAllowed(GameState state, FeaturePointer fp, Structure feature) {
        if (!(feature instanceof Field)) {
            return new DeploymentCheckResult("The Decinsky Sneznik must be placed only on a field.");
        }
        return super.isDeploymentAllowed(state, fp, feature);
    }
    
    public Stream<PlacedTile> getRangeTiles(GameState state) {
    	Position position = getPosition(state);
    	return state.getAdjacentTiles2(position).map(Tuple2::_2).append(state.getPlacedTile(position));
    }
}
