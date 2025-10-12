package com.jcloisterzone.game.capability;

import com.jcloisterzone.XMLUtils;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Tile;
import com.jcloisterzone.board.pointer.BoardPointer;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.board.TileModifier;
import com.jcloisterzone.event.DiceSixRollEvent;
import com.jcloisterzone.event.FlierDiceRollEvent;
import com.jcloisterzone.event.PlayEvent.PlayEventMeta;
import com.jcloisterzone.figure.Meeple;
import com.jcloisterzone.figure.neutral.NeutralFigure;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.capability.trait.MeteoriteProtected;
import com.jcloisterzone.game.Rule;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import com.jcloisterzone.reducers.ReturnNeutralFigure;
import com.jcloisterzone.reducers.UndeployMeeple;

import io.vavr.collection.LinkedHashMap;
import io.vavr.collection.HashSet;
import io.vavr.collection.Set;
import io.vavr.Tuple2;

import org.w3c.dom.Element;

public class MeteoriteCapability extends Capability<Void> {

	private static final long serialVersionUID = 1L;

    public static final TileModifier CRATER = new TileModifier("Crater");

    public static final Set<Position> STANDARD_1 = HashSet.of(
            new Position( 0,  0)
    	).toSet();

    public static final Set<Position> STANDARD_2 = HashSet.of(
            new Position(-1,  0),
            new Position( 0, -1),
            new Position( 0,  0),
            new Position( 0,  1),
            new Position( 1,  0)
    	).toSet();

    public static final Set<Position> STANDARD_3 = HashSet.of(
            new Position(-2,  0),
            new Position(-1, -1),
            new Position(-1,  0),
            new Position(-1,  1),
            new Position( 0, -2),
            new Position( 0, -1),
            new Position( 0,  0),
            new Position( 0,  1),
            new Position( 0,  2),
            new Position( 1, -1),
            new Position( 1,  0),
            new Position( 1,  1),
            new Position( 2,  0)
    	).toSet();

    public static final Set<Position> EXTENDED_1 = HashSet.of(
            new Position(-1,  0),
            new Position( 0, -1),
            new Position( 0,  0),
            new Position( 0,  1),
            new Position( 1,  0)
    	).toSet();

    public static final Set<Position> EXTENDED_2 = HashSet.of(
            new Position(-1, -1),
            new Position(-1,  0),
            new Position(-1,  1),
            new Position( 0, -1),
            new Position( 0,  0),
            new Position( 0,  1),
            new Position( 1, -1),
            new Position( 1,  0),
            new Position( 1,  1)
    	).toSet();

    public static final Set<Position> EXTENDED_3 = HashSet.of(
            new Position( 2, -1),
            new Position( 2,  0),
            new Position( 2,  1),
            new Position( 1, -2),
            new Position( 1, -1),
            new Position( 1,  0),
            new Position( 1,  1),
            new Position( 1,  2),
            new Position( 0, -2),
            new Position( 0, -1),
            new Position( 0,  0),
            new Position( 0,  1),
            new Position( 0,  2),
            new Position(-1, -2),
            new Position(-1, -1),
            new Position(-1,  0),
            new Position(-1,  1),
            new Position(-1,  2),
            new Position(-2, -1),
            new Position(-2,  0),
            new Position(-2,  1)
    	).toSet();

    @Override
    public Tile initTile(GameState state, Tile tile, Element tileElement) {
        if (!XMLUtils.getElementStreamByTagName(tileElement, "crater").isEmpty()) {
            tile = tile.addTileModifier(CRATER);
        }
        return tile;
    }
    
    @Override
    public GameState onTilePlaced(GameState state, PlacedTile pt) {
        if (pt.getTile().hasModifier(CRATER)) {

        	int diceValue = state.getPhase().getRandom().getNextInt(6)+1;

	        Set<Position> impact = HashSet.empty();

	        switch (diceValue) {
	        	case 6:
	        		if ("standard".equals(state.getStringRule(Rule.METEORITE_IMPACT))) {
	        			impact = STANDARD_3; // S
	        		} else {
	           			impact = EXTENDED_3; // E+C
	           		}
	    			break;
	    		case 5:
	        		if ("extended".equals(state.getStringRule(Rule.METEORITE_IMPACT))) {
	        			impact = EXTENDED_3; // E
	        		} else {
	           			impact = STANDARD_3; // S+C
	           		}
	    			break;
	        	case 4:
	        		if ("standard".equals(state.getStringRule(Rule.METEORITE_IMPACT))) {
	        			impact = STANDARD_2; // S
	        		} else {
	           			impact = EXTENDED_2; // E+C
	           		}
	    			break;
	        	case 3:
	        		if ("extended".equals(state.getStringRule(Rule.METEORITE_IMPACT))) {
	        			impact = EXTENDED_2; // E
	        		} else {
	           			impact = STANDARD_2; // S+C
	           		}
	    			break;
	        	case 2:
	        		if ("standard".equals(state.getStringRule(Rule.METEORITE_IMPACT))) {
	        			impact = STANDARD_1; // S
	        		} else {
	           			impact = EXTENDED_1; // E+C
	           		}
	    			break;
	        	case 1:
	        		if ("extended".equals(state.getStringRule(Rule.METEORITE_IMPACT))) {
	        			impact = EXTENDED_1; // E
	        		} else {
	           			impact = STANDARD_1; // S+C
	           		}
	    			break;
	        	default:
	                throw new IllegalArgumentException("Invalid distance " + diceValue);
	
	        }
	        
	        Set<Position> positions = impact.map(p -> pt.getPosition().add(p));

	        if ("combination".equals(state.getStringRule(Rule.METEORITE_IMPACT))) {
    			state = state.appendEvent(new DiceSixRollEvent(
    	                PlayEventMeta.createWithActivePlayer(state), positions, diceValue, String.format("%s.%s", "meteorite-impact", state.getStringRule(Rule.METEORITE_IMPACT))));
    		} else {
    			int impactValue = (int) Math.ceil(diceValue / 2.0);
    			state = state.appendEvent(new FlierDiceRollEvent(
	                PlayEventMeta.createWithActivePlayer(state), positions, impactValue, String.format("%s.%s", "meteorite-impact", state.getStringRule(Rule.METEORITE_IMPACT))));
    		}

	        for (Tuple2<Meeple, FeaturePointer> t: state.getDeployedMeeples()
	        		.filter(dm -> !(dm._1 instanceof MeteoriteProtected))) {
	            Meeple m = t._1;
	            FeaturePointer fp = t._2;
	            if (positions.contains(fp.getPosition())) {
	                state = (new UndeployMeeple(m, true)).apply(state);
	            }
	        }

	        for (Tuple2<NeutralFigure<?>, BoardPointer> t: state.getNeutralFigures()
	        		.getDeployedNeutralFigures()
	        		.filter(dnf -> !(dnf._1 instanceof MeteoriteProtected))) {
	            NeutralFigure<?> f = t._1;
	            BoardPointer bp = t._2;
	            if (positions.contains(bp.getPosition())) {
	                state = (new ReturnNeutralFigure(f)).apply(state);
	            }
	        }

        }

        return state;
    }

}
