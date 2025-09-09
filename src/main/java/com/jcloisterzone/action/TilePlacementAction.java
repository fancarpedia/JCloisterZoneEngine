package com.jcloisterzone.action;

import com.jcloisterzone.board.PlacementOption;
import com.jcloisterzone.board.Position;
import com.jcloisterzone.board.Rotation;
import com.jcloisterzone.board.Tile;
import com.jcloisterzone.io.message.PlaceTileMessage;

import io.vavr.collection.Set;
import io.vavr.collection.Stream;

public class TilePlacementAction extends AbstractPlayerAction<PlacementOption> {

    private static final long serialVersionUID = 1L;

    private final Tile tile;

    public TilePlacementAction(Tile tile, Set<PlacementOption> options) {
        super(options);
        this.tile = tile;
    }

    public Tile getTile() {
        return tile;
    }

    @Override
    public PlaceTileMessage select(PlacementOption tp) {
        return new PlaceTileMessage(tile.getId(), tp.getRotation(), tp.getPosition());
    }
    
    @Deprecated
    public Set<Rotation> getRotations(Position pos) {
        return Stream.ofAll(getOptions())
            .filter(tp -> tp.getPosition().equals(pos))
            .map(tp -> tp.getRotation())
            .toSet();
    }
}
