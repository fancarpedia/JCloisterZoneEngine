package com.jcloisterzone.action;

import com.jcloisterzone.board.Position;
import com.jcloisterzone.game.capability.TowerCapability;
import com.jcloisterzone.game.capability.TunnelCapability.Tunnel;

import io.vavr.collection.Set;

public class TowerPieceAction extends SelectTileAction {

	private final TowerCapability.TowerToken token;
	
    public TowerPieceAction(Set<Position> options, TowerCapability.TowerToken token) {
        super(options);
        this.token = token;
    }

    public TowerCapability.TowerToken getToken() {
        return token;
    }

}
