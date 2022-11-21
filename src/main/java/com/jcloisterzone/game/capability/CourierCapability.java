package com.jcloisterzone.game.capability;

import org.w3c.dom.Element;

import com.jcloisterzone.XMLUtils;
import com.jcloisterzone.board.Location;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Tile;
import com.jcloisterzone.board.TileModifier;
import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.feature.CourierLetter;
import com.jcloisterzone.feature.River;
import com.jcloisterzone.figure.neutral.Courier;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.game.state.PlacedTile;
import com.jcloisterzone.reducers.MoveNeutralFigure;

import io.vavr.Predicates;
import io.vavr.Tuple2;

public class CourierCapability extends Capability<Void> {

	private static final long serialVersionUID = 1L;

    public static final TileModifier COURIER_LETTER = new TileModifier("CourierLetter");

    @Override
    public Tile initTile(GameState state, Tile tile, Element tileElement) {
        if (!XMLUtils.getElementStreamByTagName(tileElement, "courier-letter").isEmpty()) {
            tile = tile.addTileModifier(COURIER_LETTER);
            tile = tile.setInitialFeatures(tile.getInitialFeatures().put(new FeaturePointer(Position.ZERO, CourierLetter.class, Location.I), new CourierLetter()));
        }
        return tile;
    }

    @Override
    public GameState onStartGame(GameState state) {
        return state.mapNeutralFigures(nf -> nf.setCourier(new Courier("courier.1")));
    }

    @Override
    public GameState onTilePlaced(GameState state, PlacedTile pt) {
        if (pt.getTile().hasModifier(COURIER_LETTER)) {
            FeaturePointer fp = pt.getTile().getInitialFeatures()
            	.filterValues(Predicates.instanceOf(CourierLetter.class))
            	.map(Tuple2::_1)
                .get();
            System.out.println(fp);
            System.out.println(pt.getTile().getInitialFeatures());
            System.out.println(fp.setPosition(pt.getPosition()));
            state = (
                new MoveNeutralFigure<>(state.getNeutralFigures().getCourier(), fp.setPosition(pt.getPosition()))
            ).apply(state);
        }
        return state;
    }

}
