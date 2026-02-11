package com.jcloisterzone.feature.modifier;

import com.jcloisterzone.game.setup.SetupQuery;

import io.vavr.collection.HashSet;
import io.vavr.collection.Set;

public class FamiliesModifier extends FeatureModifier<String> {

	public static final String CONFLICT = "";

	public FamiliesModifier(String selector, SetupQuery enabledBy) {
        super(selector, enabledBy);
    }

	@Override
    public String mergeValues(String a, String b) {
        if (a == null) return b;
        if (b == null) return a;
        if (a.equals("grey")) return b;
        if (b.equals("grey")) return a;
        if (a.equals("both") || b.equals("any")) return "both";
    	return a.equals(b) ? a : CONFLICT;
    }

    @Override
    public String valueOf(String attr) {
        return attr;
    }
}