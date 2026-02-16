package com.jcloisterzone.game.phase;

import com.jcloisterzone.board.Tile;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.event.DiceSixRollEvent;
import com.jcloisterzone.event.PlayEvent.PlayEventMeta;
import com.jcloisterzone.feature.City;
import com.jcloisterzone.feature.GamblersLuckShield;
import com.jcloisterzone.feature.Road;
import com.jcloisterzone.feature.Feature;
import com.jcloisterzone.feature.modifier.FeatureModifier;
import com.jcloisterzone.game.Rule;
import com.jcloisterzone.game.capability.FamiliesCapability;
import com.jcloisterzone.game.capability.GamblersLuckCapability;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import com.jcloisterzone.random.RandomGenerator;

import io.vavr.Tuple2;
import io.vavr.Tuple3;
import io.vavr.collection.HashMap;
import io.vavr.collection.HashSet;
import io.vavr.collection.Map;
import io.vavr.collection.LinkedHashMap;
import io.vavr.collection.List;
import io.vavr.collection.Set;
import io.vavr.collection.Stream;
import io.vavr.collection.TreeMap;

import java.util.function.Function;

public class GamblersLuckDicePhase extends Phase {

	public static final Map<Integer, Tuple3<Integer, String, GamblersLuckCapability.GamblersLuckShieldToken>> DICE_REGULAR = TreeMap.of(
		1, new Tuple3(1, "grey", GamblersLuckCapability.GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_1),
		2, new Tuple3(2, "grey" /*both*/, GamblersLuckCapability.GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_2),
		3, new Tuple3(3, "grey", GamblersLuckCapability.GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_3),
		4, new Tuple3(null, null, GamblersLuckCapability.GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_X),
		5, new Tuple3(0, null, GamblersLuckCapability.GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_0),
		6, new Tuple3(0, null, GamblersLuckCapability.GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_0)
	);
	
	public static final Map<Integer, Tuple3<Integer, String, GamblersLuckCapability.GamblersLuckShieldToken>> DICE_MAYOR = TreeMap.of(
			1, new Tuple3(1, "grey", GamblersLuckCapability.GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_1),
			2, new Tuple3(2, "grey", GamblersLuckCapability.GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_2),
			3, new Tuple3(null, null, GamblersLuckCapability.GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_X),
			4, new Tuple3(null, null, GamblersLuckCapability.GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_X),
			5, new Tuple3(0, null, GamblersLuckCapability.GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_0),
			6, new Tuple3(0, null, GamblersLuckCapability.GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_0)
		);

	public GamblersLuckDicePhase(RandomGenerator random, Phase defaultNext) {
        super(random, defaultNext);
    }

    @Override
    public StepResult enter(GameState state) {
        Position pos = state.getLastPlaced().getPosition();

        GamblersLuckCapability cap = state.getCapabilities().get(GamblersLuckCapability.class);
        
        Stream<Tuple2<FeaturePointer,GamblersLuckShield>> shields = cap.getPlacedTileGamblersLuckShields(state);
        
        if (shields.length() == 0) {
        	return next(state);
        }

        Map<FeaturePointer, Tuple2<GamblersLuckCapability.GamblersLuckShieldToken,Integer>> model = cap.getModel(state);

        Map<Integer, Tuple3<Integer, String, GamblersLuckCapability.GamblersLuckShieldToken>> dice = DICE_REGULAR;
        if (state.getElements().get("mayor").getOrNull() != null) {
        	dice = DICE_MAYOR;
        }
        
    	for(Tuple2<FeaturePointer,GamblersLuckShield> shield: shields) {
        	int diceValue = state.getPhase().getRandom().getNextInt(6)+1;
        	int randomRotation = state.getPhase().getRandom().getNextInt(8)-5;
        	model = model.put(shield._1, new Tuple2(dice.get(diceValue).get()._3,randomRotation));
			state = state.appendEvent(new DiceSixRollEvent(
	                PlayEventMeta.createWithActivePlayer(state), HashSet.of(pos), diceValue, String.format("%s.%s", "gamblers-luck-dice", dice.get(diceValue).get()._3)));
        }
        
        state = cap.setModel(state, model);

		Map<FeaturePointer,City> cities = state
				.getPlacedTile(pos)
				.getTile()
				.getInitialFeatures()
				.filterValues(f -> f instanceof City)
				.mapValues(f -> (City) f);

		for(Tuple2<FeaturePointer,City> city: cities) {
			Stream<FeaturePointer> initialShields = city._2.getModifier(state, City.GAMBLERS_LUCK_SHIELDS, Stream.empty() );
			Stream<FeaturePointer> placedShields = Stream.empty();
			int newShields = city._2.getModifier(state, City.PENNANTS, 0);
			boolean eliminatedPennats = false;
			String family = null;
			for(FeaturePointer initialShield: initialShields) {
				FeaturePointer placedShield = initialShield.setPosition(pos);
				placedShields = placedShields.append(placedShield);
				Tuple2<GamblersLuckCapability.GamblersLuckShieldToken,Integer> currentToken = model.get(placedShield).getOrNull();
				Tuple3<Integer, String, GamblersLuckCapability.GamblersLuckShieldToken> diceValue = findByToken(dice, currentToken._1);
				if (diceValue._1 == null) {
					eliminatedPennats = true;
				} else if (diceValue._1 > 0) {
					newShields += diceValue._1;
					if (family == null || !family.equals("both")) {
						family = diceValue._2;
					}
				}
			}
			Map<FeatureModifier<?>, Object> modifiers = city._2.getModifiers();
			if (eliminatedPennats) {
				modifiers = modifiers.put(City.ELIMINATED_PENNANTS, eliminatedPennats);
			}
			if (newShields>0) {
				modifiers = modifiers.put(City.PENNANTS, newShields);
				modifiers = modifiers.put(FamiliesCapability.FAMILY, family);
			}
			modifiers = modifiers.replace(City.GAMBLERS_LUCK_SHIELDS,initialShields,placedShields);

			state = updatedInitialFeatures(state, pos, city, modifiers);
		}

        
        return next(state);
    }
    
    public static Tuple3<Integer, String, GamblersLuckCapability.GamblersLuckShieldToken>
    	findByToken(
    			Map<Integer, Tuple3<Integer, String, GamblersLuckCapability.GamblersLuckShieldToken>> dice,
    			GamblersLuckCapability.GamblersLuckShieldToken token) {

        return dice.values()
            .filter(t -> t._3 == token)
            .getOrNull();
    }
    
    private GameState updatedInitialFeatures(GameState state, Position pos,
            Tuple2<FeaturePointer, City> city,
            Map<FeatureModifier<?>, Object> modifiers) {

        // get original tile
        Tile tile = state.getPlacedTile(pos).getTile();
        Map<FeaturePointer, Feature> features = tile.getInitialFeatures();

        final FeaturePointer cityKey = city._1;
        final City cityValue = city._2;
        final Map<FeatureModifier<?>, Object> modifiersFinal = modifiers;

        // update features in the tile
        Tile updatedTile = tile.setInitialFeatures(
            features.put(
                cityKey,
                features.get(cityKey)
                        .map(f -> ((City) f).setModifiers(modifiersFinal))
                        .getOrElse(() -> cityValue.setModifiers(modifiersFinal))
            )
        );
        LinkedHashMap<Position, PlacedTile> placedTiles = state.getPlacedTiles();

        PlacedTile updatedPlacedTile = placedTiles.get(pos)
            .map(pt -> pt.setTile(updatedTile))
            .getOrElseThrow(() -> new IllegalArgumentException("No tile at position " + pos));

        placedTiles = placedTiles.put(pos, updatedPlacedTile);
        
        state = state.setPlacedTiles(placedTiles);
        
        // Initial Features are updated, now we are going to recalculate city modifier by them
        
        FeaturePointer cityOnBoard = city._1.setPosition(pos).rotateCW(state.getPlacedTile(pos).getRotation());
        
        List<FeaturePointer> places = state.getFeature(cityOnBoard).getPlaces();

        final GameState capturedState = state;  // Capture in final variable
        List<City> initialFeatures = places
            .map(fp -> {
            	PlacedTile pt = capturedState.getPlacedTile(fp.getPosition());
                return (City) pt.getInitialFeaturePartOf(fp.getLocation())._2
                             .placeOnBoard(fp.getPosition(), pt.getRotation());
            });

        Map<FeatureModifier<?>, Object> EMPTY = HashMap.empty();
        Map<FeatureModifier<?>, Object> updatedModifiers = initialFeatures.foldLeft(EMPTY, (res, _city) -> _city.mergeModifiers(res));

        City updateCity = city._2.setModifiers(updatedModifiers);
        
        state = updateCityComplex(state, cityOnBoard, updatedModifiers);
      
        return state;
    }
    
    /**
     * Scenario: Update a city with multiple changes to initialFeatures
     * (e.g., add modifiers, close edges, update state)
     */
    public GameState updateCityComplex(GameState state, FeaturePointer cityPointer, Map<FeatureModifier<?>, Object> modifiers) {
        // Step 1: Get the original city
        City originalCity = (City) state.getFeature(cityPointer);
        
        // Step 2: Apply multiple transformations
        City updatedCity = originalCity
            .setModifiers(modifiers);
        
        // Step 3: Build the update map for all city pointers
        // This ensures every FeaturePointer pointing to this city
        // in the featureMap now points to the updated version
        Map<FeaturePointer, Feature> featureMapUpdate = originalCity.getPlaces()
            .foldLeft(
                HashMap.empty(),
                (map, fp) -> map.put(fp, updatedCity)
            );
        
        // Step 4: Apply update
        return state.updateFeatureMap(featureMapUpdate);
    }
}
