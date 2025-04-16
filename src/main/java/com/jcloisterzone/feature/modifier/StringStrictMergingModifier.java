package com.jcloisterzone.feature.modifier;

import com.jcloisterzone.game.setup.SetupQuery;

public class StringStrictMergingModifier extends FeatureModifier<String> {

	public static final String CONFLICT = "";
	
    public StringStrictMergingModifier(String selector, SetupQuery enabledBy) {
        super(selector, enabledBy);
    }

    @Override
    public String mergeValues(String a, String b) {
    	if (a == null) return b;
    	if (b == null) return a;
    	return a.equals(b) ? a : CONFLICT;
    }

    @Override
    public String valueOf(String attr) {
        return attr;
    }
}
