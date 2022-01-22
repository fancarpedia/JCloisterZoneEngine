package com.jcloisterzone.game.capability;

import static com.jcloisterzone.XMLUtils.contentAsLocations;

import org.w3c.dom.Element;

import com.jcloisterzone.Player;
import com.jcloisterzone.XMLUtils;
import com.jcloisterzone.action.ReturnMeepleAction;
import com.jcloisterzone.board.*;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.board.pointer.MeeplePointer;
import com.jcloisterzone.feature.BarberSurgeon;
import com.jcloisterzone.feature.Feature;
import com.jcloisterzone.figure.Meeple;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.state.ActionsState;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.io.message.ReturnMeepleMessage;

import io.vavr.Tuple2;
import io.vavr.collection.HashMap;
import io.vavr.collection.HashSet;
import io.vavr.collection.List;
import io.vavr.collection.Vector;

/**
 * @model Tuple2<Meeple, FeaturePointer>
 *  : scored only one meeple
 */
public class BarberSurgeonCapability extends Capability<Tuple2<Meeple, FeaturePointer>> {

	private static final long serialVersionUID = 1L;

	public static final TileModifier BARBERSURGEON = new TileModifier("BarberSurgeon");

    @Override
    public Tile initTile(GameState state, Tile tile, Element tileElement) {
        Vector<Element> elements = XMLUtils.getElementStreamByTagName(tileElement, "barber-surgeon").toVector();

		for(Element element : elements) {
            Location location = XMLUtils.contentAsLocations(element).flatMap(loc -> List.of(loc)).get();
            Integer value = XMLUtils.attributeIntValue(element, "value");
            System.out.println(new FeaturePointer(Position.ZERO, BarberSurgeon.class, location));
            BarberSurgeon barberSurgeon = new BarberSurgeon(List.of(new FeaturePointer(Position.ZERO, BarberSurgeon.class, location)), HashMap.of(BarberSurgeon.VALUE, value));
            tile = tile.setInitialFeatures(tile.getInitialFeatures().put(barberSurgeon.getPlace(), barberSurgeon));
            return tile;
        }
		return tile;
    }

    @Override
    public GameState onStartGame(GameState state) {

    	List<Tile> barberSurgeonTiles = state.getTilePack().getGroups().toStream().flatMap(t -> t._2.getTiles()).filter(tile -> tile.getInitialFeatures().exists(t -> t._2 instanceof BarberSurgeon)).toList();
        
        int playersCount = state.getPlayers().getPlayers().size();
       
        int removeIndex;
        // Remove all tiles with barber surgeons when count of then is more than count of players + 2
        while ((playersCount + 2) < barberSurgeonTiles.size()) {
//        	removeIndex = state.getPhase().getRandom().getNextInt(barberSurgeonTiles.size());
            System.out.println("Remove index by random");
            System.out.println("Remove also from client tile sheet");
            removeIndex = 1;
        	state = state.setTilePack(state.getTilePack().removeTilesById(barberSurgeonTiles.get(removeIndex).getId(),1));
        	barberSurgeonTiles = barberSurgeonTiles.removeAt(removeIndex);
        }
        
        return state;
    }

    @Override
    public GameState onActionPhaseEntered(GameState state) {
        ActionsState actions = state.getPlayerActions();
        HashSet places = HashSet.empty();
        Player active = state.getActivePlayer();
        Position placeTilePos = state.getLastPlaced().getPosition();
        for (Tuple2<Meeple, FeaturePointer> t : state.getDeployedMeeples()) {
            Meeple meeple = t._1;
            FeaturePointer fp = t._2;
            Feature feature = state.getFeature(fp);
            if (meeple.getPlayer().equals(active) && !fp.getPosition().equals(placeTilePos) && (feature instanceof BarberSurgeon)) {
                places = places.add(new MeeplePointer(fp, meeple.getId()));
            }
        }

        if (!places.isEmpty()){
            actions = actions.appendAction(new ReturnMeepleAction(places, ReturnMeepleMessage.ReturnMeepleSource.BARBER_SURGEON));
            state = state.setPlayerActions(actions);
        }
        return state;
    }
}