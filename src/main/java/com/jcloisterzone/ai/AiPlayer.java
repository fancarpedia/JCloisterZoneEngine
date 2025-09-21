package com.jcloisterzone.ai;

import com.jcloisterzone.Player;
import com.jcloisterzone.action.ConfirmAction;
import com.jcloisterzone.action.PlayerAction;
import com.jcloisterzone.game.GameSetup;
import com.jcloisterzone.game.state.ActionsState;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.io.message.CommitMessage;
import com.jcloisterzone.io.message.PassMessage;
import com.jcloisterzone.io.message.ReplayableMessage;

import io.vavr.Function1;
import io.vavr.collection.Vector;

public interface AiPlayer extends Function1<GameState, ReplayableMessage> {

    default Vector<ReplayableMessage> getPossibleActions(GameState state) {
        ActionsState as = state.getPlayerActions();

//   	 	System.out.println("DEBUG actions = " + as.getActions());
        
        Vector<ReplayableMessage> messages = as.getActions().flatMap(action -> {
          if (action instanceof ConfirmAction) {
            return Vector.of(new CommitMessage());
          } else {
	        return action.getOptions().map(o -> {
//	       	  System.out.println("DEBUG action = " + action);
//	          System.out.println("DEBUG option = " + o);
	          return Helpers.createMessage(action, o);
	        }).toVector();
          }
        });

        if (as.isPassAllowed()) {// && messages.size() == 0) {
            messages = messages.append(new PassMessage());
        }

        return messages;
    }

    static class Helpers {
        @SuppressWarnings({ "rawtypes", "unchecked" })
        public static ReplayableMessage createMessage(PlayerAction action, Object option) {
//       	 	System.out.println("DEBUG2 action = " + action);
//       	 	System.out.println("DEBUG2 option = " + option);
            return action.select(option);
        }
    }
}
