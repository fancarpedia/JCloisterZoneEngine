package com.jcloisterzone.reducers;

import com.jcloisterzone.Player;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.feature.Castle;
import com.jcloisterzone.game.ScoreFeatureReducer;
import com.jcloisterzone.game.state.GameState;

import io.vavr.collection.List;

public class ScoreCastle extends ScoreFeature implements ScoreFeatureReducer {

    private final PointsExpression points;

    public ScoreCastle(Castle feature, PointsExpression points, boolean isFinal) {
        super(feature, isFinal);
        List<ExprItem> items = points.getItems();
        for(ExprItem item: items) {
        	if (item.getName().startsWith("marketplace.")) {
        		items = items.remove(item);
        	}
        }
        Integer itemsPoints = items.map(exp -> exp.getPoints()).sum().intValue();
    	this.points = new PointsExpression("castle", new ExprItem("castle." + points.getName(), itemsPoints));
    }

    @Override
    protected GameState addFiguresBonusPoints(GameState state) {
        if (isFinal) {
            // no bonuses for unfinished castle, castle is not scored at the end
            return state;
        }
        return super.addFiguresBonusPoints(state);
    }

    @Override
    protected PointsExpression getFeaturePoints(GameState state, Player player) {
        return points;
    }

    @Override
    public PointsExpression getFeaturePoints() {
        return points;
    }
}
