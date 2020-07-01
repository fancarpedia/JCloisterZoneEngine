package com.jcloisterzone.action;

import com.jcloisterzone.board.Position;
import com.jcloisterzone.game.capability.GoldminesCapability.GoldToken;
import com.jcloisterzone.wsio.message.PlaceTokenMessage;
import com.jcloisterzone.wsio.message.WsInGameMessage;
import io.vavr.collection.Set;

public class GoldPieceAction extends SelectTileAction {

    public GoldPieceAction(Set<Position> options) {
        super(options);
    }

    @Override
    public WsInGameMessage select(Position pos) {
        return new PlaceTokenMessage(GoldToken.GOLD, pos);
    }

    @Override
    public String toString() {
        return "place gold piece";
    }
}
