package com.jcloisterzone.action;

import com.jcloisterzone.game.capability.BazaarItem;
import io.vavr.collection.Set;

public class BazaarSelectTileAction extends AbstractPlayerAction<BazaarItem> {

	boolean noAuction;
	
    public BazaarSelectTileAction(Set<BazaarItem> options, boolean noAuction) {
        super(options);
        this.noAuction = noAuction;
    }
    
    public boolean getNoAuction() {
    	return noAuction;
    }
}
