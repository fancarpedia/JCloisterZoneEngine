package com.jcloisterzone.game.phase;

import com.jcloisterzone.action.FerriesAction;
import com.jcloisterzone.action.TunnelAction;
import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.feature.Road;
import com.jcloisterzone.game.Token;
import com.jcloisterzone.game.capability.FerriesCapability;
import com.jcloisterzone.game.capability.FerriesCapability.FerryToken;
import com.jcloisterzone.game.capability.FerriesCapabilityModel;
import com.jcloisterzone.game.capability.RussianPromosTrapCapability;
import com.jcloisterzone.game.capability.TunnelCapability;
import com.jcloisterzone.game.capability.trait.FeatureCompletionBlocker;
import com.jcloisterzone.game.state.ActionsState;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import com.jcloisterzone.io.message.PlaceTokenMessage;
import com.jcloisterzone.random.RandomGenerator;
import com.jcloisterzone.reducers.ChangeFerry;
import com.jcloisterzone.reducers.PlaceTunnel;

import io.vavr.Tuple2;
import io.vavr.collection.HashSet;
import io.vavr.collection.List;
import io.vavr.collection.Seq;
import io.vavr.collection.Set;
import io.vavr.collection.Vector;

public class ChangeFerriesPhase extends Phase {

    public ChangeFerriesPhase(RandomGenerator random, Phase defaultNext) {
        super(random, defaultNext);
    }

    @Override
    public StepResult enter(GameState state) {
        PlacedTile lastPlaced = state.getLastPlaced();
        Position pos = lastPlaced.getPosition();
        FerriesCapabilityModel model =  state.getCapabilityModel(FerriesCapability.class);

        Set<FeaturePointer> ferries = model.getFerries()
            .filter(f -> !f.getPosition().equals(pos));

        Set<FeaturePointer> options = state.getTileFeatures2(pos, Road.class)
            .flatMap(t -> t._2.findNearest(state, t._1, fp -> ferries.find(f -> fp.isPartOf(f)).isDefined()))
            .distinct()
            .filter(ferryPart -> !model.getMovedFerries().containsKey(ferryPart.getPosition()))
            .flatMap(ferryPart -> {
                // map nearest ferry to action options
                // (options for each are other possible ferry locations then current)
                Position ferryPos = ferryPart.getPosition();
                PlacedTile ferryTile = state.getPlacedTile(ferryPos);
                return ferryTile
                    .getTile()
                    .getInitialFeatures()
                    .filter(t -> t._2 instanceof Road)
                    .map(t -> t._1.getLocation())
                    .combinations(2)
                    .map(pair -> pair.reduce(Location::union))
                    .map(loc -> loc.rotateCW(ferryTile.getRotation()))
                    .map(loc -> new FeaturePointer(ferryPos, Road.class, loc))
                    .filter(fp -> !ferries.contains(fp))
                    .toList();
            })
            .toSet();

        if (options.isEmpty()) {
            return next(state);
        } 

        Set<FeaturePointer> allowedOptions = options;
		Seq<FeatureCompletionBlocker> completionBlockers = state.getCapabilities().toSeq(FeatureCompletionBlocker.class);

		if (completionBlockers.size()>0) {
	    	allowedOptions = HashSet.empty();
	    	for(FeaturePointer newFerry: options) {
	        	ActionsState _as;
	    		_as = new ActionsState(state.getTurnPlayer(), Vector.of(new FerriesAction(options)), true);
	    		boolean isBlocked = false;
	    		for (FeatureCompletionBlocker cap : state.getCapabilities().toSeq(FeatureCompletionBlocker.class)) {
	    			if (!isBlocked) {
		        		GameState _state = state.setPlayerActions(_as);
		                FerriesCapabilityModel _model =  _state.getCapabilityModel(FerriesCapability.class);
		
		                Position _pos = newFerry.getPosition();
		                FeaturePointer oldFerry = _model.getFerries().find(f -> f.getPosition().equals(_pos)).get();
		
		            	_state = _state.setCapabilityModel(FerriesCapability.class, _model.mapMovedFerries(
		                    mf -> mf.put(pos, new Tuple2<>(oldFerry.getLocation(), newFerry.getLocation()))
		                ));
		                _state = (new ChangeFerry(oldFerry, newFerry)).apply(_state);
		                
		                // Roads for Ferries are stored by Edge Location not joined locations for option to split Road segments after move of Ferry

		                List<Location> newLocations = newFerry.getLocation().splitToSides().removeAll(oldFerry.getLocation().splitToSides());

	                   	for(Location _loc: newLocations) {
		                	FeaturePointer _fp = new FeaturePointer(oldFerry.getPosition(),Road.class,_loc);
		                   	if (!isBlocked && cap.isFeatureCompletionBlocked(_state, _fp)) {
		                		isBlocked = true;
		                	}
		                }
	
		                List<Location> leavingLocations = oldFerry.getLocation().splitToSides().removeAll(newFerry.getLocation().splitToSides());
		                
	                   	for(Location _loc: leavingLocations) {
		                	FeaturePointer _fp = new FeaturePointer(oldFerry.getPosition(),Road.class,_loc);
		                   	if (!isBlocked && cap.isFeatureCompletionBlocked(_state, _fp)) {
		                		isBlocked = true;
		                	}
		                }
	    			}
	        	}
	            if (!isBlocked) {
	        		allowedOptions = allowedOptions.add(newFerry);
	            }
	        }
		}

        return promote(state.setPlayerActions(
            new ActionsState(state.getTurnPlayer(), new FerriesAction(allowedOptions), true)
        ));
    }

    @PhaseMessageHandler
    public StepResult handlePlaceToken(GameState state, PlaceTokenMessage msg) {
        Token token = msg.getToken();

        if (token != FerryToken.FERRY) {
            throw new IllegalArgumentException();
        }

        FerriesCapabilityModel model =  state.getCapabilityModel(FerriesCapability.class);

        FeaturePointer newFerry = msg.getPointer().asFeaturePointer();
        Position pos = newFerry.getPosition();
        FeaturePointer oldFerry = model.getFerries().find(f -> f.getPosition().equals(pos)).get();

        state = state.setCapabilityModel(FerriesCapability.class, model.mapMovedFerries(
            mf -> mf.put(pos, new Tuple2<>(oldFerry.getLocation(), newFerry.getLocation()))
        ));
        state = (new ChangeFerry(oldFerry, newFerry)).apply(state);
        state = clearActions(state);

        RussianPromosTrapCapability russianPromos = state.getCapabilities().get(RussianPromosTrapCapability.class);
        if (russianPromos != null) {
            state = russianPromos.trapFollowers(state);
        }

        return enter(state);
    }

}
