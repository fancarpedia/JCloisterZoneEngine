package com.jcloisterzone.feature;

import java.util.ArrayList;

import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Rotation;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.feature.modifier.FeatureModifier;
import com.jcloisterzone.feature.modifier.IntegerAddModifier;
import com.jcloisterzone.game.state.GameState;

import io.vavr.collection.HashMap;
import io.vavr.collection.List;
import io.vavr.collection.Map;

public class BarberSurgeon extends TileFeature implements TrapFeature, Structure, ModifiedFeature<BarberSurgeon> {

    public static final IntegerAddModifier VALUE = new IntegerAddModifier("barber-surgeon[value]", null);

    private final Map<FeatureModifier<?>, Object> modifiers;

    public BarberSurgeon(List<FeaturePointer> places, Map<FeatureModifier<?>, Object> modifiers) {
        super(places);
        this.modifiers = modifiers;
    }

    @Override
    public BarberSurgeon setModifiers(Map<FeatureModifier<?>, Object> modifiers) {
        if (this.modifiers == modifiers) return this;
        return new BarberSurgeon(places, modifiers);
    }

    @Override
    public Map<FeatureModifier<?>, Object> getModifiers() {
        return modifiers;
    }

    @Override
    public BarberSurgeon placeOnBoard(Position pos, Rotation rot) {
        return new BarberSurgeon(placeOnBoardPlaces(pos, rot), modifiers);
    }
    
    public Integer getValue(GameState state) {
    	Integer value = getModifier(state, VALUE, null);
    	return value;
    }

    public static String name() {
        return "BarberSurgeon";
    }
}
