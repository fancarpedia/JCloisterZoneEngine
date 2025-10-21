package com.jcloisterzone.feature.modifier;

import com.jcloisterzone.game.setup.SetupQuery;
import io.vavr.collection.HashMap;
import io.vavr.collection.Map;

public class MultisetStringIntegerAddModifier extends FeatureModifier<Map<String, Integer>> {

    public MultisetStringIntegerAddModifier(String selector, SetupQuery enabledBy) {
        super(selector, enabledBy);
    }

    @Override
    public Map<String, Integer> mergeValues(Map<String, Integer> a, Map<String, Integer> b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.merge(b, Integer::sum); // adds counts for common keys
    }

    @Override
    public Map<String, Integer> valueOf(String attr) {
        if (attr == null || attr.isBlank()) {
            return HashMap.empty();
        }
        Map<String, Integer> result = HashMap.empty();
        for (String token : attr.split("\\s+")) {
            result = result.put(token, result.get(token).getOrElse(0) + 1);
        }
        return result;
    }
}