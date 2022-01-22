package com.jcloisterzone.feature.modifier;

import com.jcloisterzone.game.setup.SetupQuery;
import io.vavr.collection.Array;

public class IntegerArrayModifier extends FeatureModifier<Array<Integer>> {

    public IntegerArrayModifier(String selector, SetupQuery enabledBy) {
        super(selector, enabledBy);
    }

    @Override
    public Array<Integer> mergeValues(Array<Integer> a, Array<Integer> b) {
        return a.appendAll(b);
    }

    @Override
    public Array<Integer> valueOf(String attr) {
        return Array.of(Integer.parseInt(attr));
    }
}