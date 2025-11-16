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
import io.vavr.collection.HashSet;
import io.vavr.collection.Set;
import io.vavr.collection.Stream;

public class Obelisk extends Special implements FlowersBonusAffected, RangeFigure, TopLeftTranslatedFigurePosition {

    private static final long serialVersionUID = 1L;

    public static final Set<Position> RANGE_POSITIONS = HashSet.of(
            new Position(-2, -2),
            new Position(-2, -1),
            new Position(-2,  0),
            new Position(-2,  1),
            new Position(-1, -2),
            new Position(-1, -1),
            new Position(-1,  0),
            new Position(-1,  1),
            new Position( 0, -2),
            new Position( 0, -1),
            new Position( 0,  0),
            new Position( 0,  1),
            new Position( 1, -2),
            new Position( 1, -1),
            new Position( 1,  0),
            new Position( 1,  1)
    	).toSet();

    public Obelisk(String id, Player player) {
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
            return new DeploymentCheckResult("The obelisk must be placed only on a field.");
        }
        return super.isDeploymentAllowed(state, fp, feature);
    }
    
    public Stream<PlacedTile> getRangeTiles(GameState state) {
        return RANGE_POSITIONS
                .map(
                    offset -> state.getPlacedTile(getPosition(state).add(offset))
                )
                .filter(locTile -> locTile != null)
                .toStream();
    }
}
