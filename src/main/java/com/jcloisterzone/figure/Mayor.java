package com.jcloisterzone.figure;

import com.jcloisterzone.Immutable;
import com.jcloisterzone.Player;
import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.feature.*;
import com.jcloisterzone.game.state.GameState;

@Immutable
public class Mayor extends Follower {

    private static final long serialVersionUID = 1L;

    public Mayor(String id, Player player) {
        super(id, player);
    }

    @Override
    public int getPower(GameState state, Scoreable feature) {
        if (feature instanceof City) {
            if (((City) feature).hasModifier(state, City.ELIMINATED_PENNANTS)) {
            	return 0; // Pennants are eliminated in the City
            }
            return ((City) feature).getModifier(state, City.PENNANTS, 0);
        } else {
            // If not City, then it must be Castle. Mayor has no power on Castles
            return 0;
        }
    }

    @Override
    public DeploymentCheckResult isDeploymentAllowed(GameState state, FeaturePointer fp, Structure feature) {
        if (!(fp.getLocation() == Location.QUARTER_CASTLE ||
              feature instanceof City || feature instanceof FlyingMachine|| feature instanceof TrapFeature)) {
            return new DeploymentCheckResult("Mayor must be placed in city only.");
        }
        return super.isDeploymentAllowed(state, fp, feature);
    }

}
