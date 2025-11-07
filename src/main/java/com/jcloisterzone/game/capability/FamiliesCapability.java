package com.jcloisterzone.game.capability;

import com.jcloisterzone.board.*;
import com.jcloisterzone.feature.City;
import com.jcloisterzone.feature.Feature;
import com.jcloisterzone.feature.Structure;
import com.jcloisterzone.feature.modifier.StringStrictMergingModifier;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.setup.GameElementQuery;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import com.jcloisterzone.reducers.PlaceTile;

import io.vavr.collection.Stream;

import static com.jcloisterzone.XMLUtils.attributeIntValue;
import static com.jcloisterzone.XMLUtils.attributeStringValue;

import org.w3c.dom.Element;

public class FamiliesCapability extends Capability<Void> {

	public static final StringStrictMergingModifier FAMILY = new StringStrictMergingModifier("family", new GameElementQuery("families"));

	@Override
    public Feature initFeature(GameState state, String tileId, Feature feature, Element xml) {
        if (feature instanceof City) {
    	    if (attributeIntValue(xml, "pennants", 0) > 0 ) {
                String family = "blue";
                if (xml.hasAttribute("family")) {
                    family = xml.getAttribute("family");
                }
                feature = ((City) feature).putModifier(FAMILY, family);
    	    }
        }
        return feature;
    }

	@Override
    public boolean isTilePlacementAllowed(GameState state, Tile tile, PlacementOption placement) {
		
		if (!(FAMILY.getEnabledBy() != null && FAMILY.getEnabledBy().apply(state))) return true;
		     // Skip testing if FAMILY is not initalized by setup

		Position pos = placement.getPosition();
        Rotation rot = placement.getRotation();

        final GameState finalState = (new PlaceTile(tile, pos, rot)).apply(state);

        Stream<City> cities = finalState.getTileFeatures2(pos, Structure.class)
        	    .filter(fp -> fp._2 instanceof City && ((City) fp._2).getModifier(finalState, City.PENNANTS, 0) > 0)
        	    .map(fp -> (City) fp._2)
        	    .toStream();
        
        if (cities.isEmpty()) {
        	// No city with Pennant, placement allowed
        	return true;
        }
        
        return !cities.exists(city ->
            city.getModifier(finalState, FAMILY, null).equals(StringStrictMergingModifier.CONFLICT)
        );
    }
}
