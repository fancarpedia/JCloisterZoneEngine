package com.jcloisterzone.feature.modifier;

import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.feature.Feature;
import com.jcloisterzone.feature.ModifiedFeature;
import com.jcloisterzone.game.setup.SetupQuery;
import io.vavr.collection.Stream;

public class FeaturePointerAddModifier<F extends Feature> extends FeatureModifier<Stream<FeaturePointer>> {

	private final Class<F> featureClass;
	
    public FeaturePointerAddModifier(String selector, SetupQuery enabledBy, Class<F> featureClass) {
        super(selector, enabledBy);
        this.featureClass = featureClass;
    }

    @Override
    public Stream<FeaturePointer> mergeValues(Stream<FeaturePointer> a, Stream<FeaturePointer> b) {
    	if (a == null) {
    		return b;
    	}
    	if (b == null) {
    		return a;
    	}
        return a.appendAll(b);
    }

    @Override
    public Stream<FeaturePointer> valueOf(String attr) {
    	String[] locations = attr.trim().split("\\s+");

    	return Stream.of(locations).map(s -> new FeaturePointer(Position.ZERO, this.featureClass, Location.valueOf(s)));
    }
}