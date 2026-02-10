package com.jcloisterzone.game.capability;

import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.feature.City;
import com.jcloisterzone.feature.Feature;
import com.jcloisterzone.feature.Field;
import com.jcloisterzone.feature.GamblersLuckShield;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.capability.FamiliesCapability;
import com.jcloisterzone.game.Token;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import com.jcloisterzone.random.RandomGenerator;

import static com.jcloisterzone.XMLUtils.attributeStringValue;

import io.vavr.Tuple2;
import io.vavr.collection.HashMap;
import io.vavr.collection.Map;
import io.vavr.collection.Stream;

import org.w3c.dom.Element;

/**
 * Capability model is {@code Map<FeaturePointer, String>} - Gambler's Luck Shield Tokens,
 *   key is Gambler's Luck Shield Token id or null if nothing is placed
 */
public final class GamblersLuckCapability extends Capability<Map<FeaturePointer, Tuple2<GamblersLuckCapability.GamblersLuckShieldToken,Integer>>> {
	
	public enum GamblersLuckShieldToken implements Token {
		GAMBLERSLUCKSHIELD_0,
		GAMBLERSLUCKSHIELD_1,
		GAMBLERSLUCKSHIELD_2,
		GAMBLERSLUCKSHIELD_3,
		GAMBLERSLUCKSHIELD_X
	}
	
	private static final long serialVersionUID = 1L;
	
	@Override
    public Feature initFeature(GameState state, String tileId, Feature feature, Element xml) {
        if (feature instanceof City) {
    	    if (!("".equals(attributeStringValue(xml, "gamblers-luck-shield", "")))) {
                String family = "unknown";
                if (xml.hasAttribute("family")) {
                    family = xml.getAttribute("family");
                }
                feature = ((City) feature).putModifier(FamiliesCapability.FAMILY, family);
    	    }
        }
        return feature;
    }

	@Override
	public GameState onStartGame(GameState state, RandomGenerator random) {
		return setModel(state, HashMap.empty());
	}
	
	public Stream<Tuple2<FeaturePointer,GamblersLuckShield>> getPlacedTileGamblersLuckShields(GameState state) {
		return getGamblersLuckShieldsOnPlacedTile(state, state.getLastPlaced());
	}

	public Stream<Tuple2<FeaturePointer,GamblersLuckShield>> getGamblersLuckShieldsOnPlacedTile(GameState state, PlacedTile pt) {
		return state.getTileFeatures2(pt.getPosition(), GamblersLuckShield.class);
	}

	public boolean hasPlacedTileGamblersLuckShields(GameState state) {
		return getPlacedTileGamblersLuckShields(state).length()!=0;
	}
}
