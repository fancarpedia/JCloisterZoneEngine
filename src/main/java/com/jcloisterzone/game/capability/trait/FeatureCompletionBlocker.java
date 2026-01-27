package com.jcloisterzone.game.capability.trait;

import com.jcloisterzone.board.pointer.FeaturePointer;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.state.GameState;

public interface FeatureCompletionBlocker {

	public boolean isFeatureCompletionBlocked(GameState state, FeaturePointer fp);

}
