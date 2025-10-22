package com.jcloisterzone.ai.player;

import java.io.InputStream;
import java.io.PrintStream;
import java.util.Scanner;
import java.util.stream.Collectors;

import com.jcloisterzone.ai.AiPlayer;
import com.jcloisterzone.ai.GameStateRanking;
import com.jcloisterzone.Player;
import com.jcloisterzone.game.GameSetup;
import com.jcloisterzone.game.GameStatePhaseReducer;
import com.jcloisterzone.game.capability.PortalCapability;
import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.io.message.PlaceTileMessage;
import com.jcloisterzone.io.message.ReplayableMessage;

import io.vavr.Tuple2;
import io.vavr.collection.Queue;
import io.vavr.collection.Vector;

public abstract class RankingAiPlayer implements AiPlayer {

    private GameStateRanking stateRanking;
    private GameStatePhaseReducer phaseReducer;

    private Player me;
    private Vector<ReplayableMessage> messages = Vector.empty();

    /**
     * Instantiates a new {@code PlayerAction}.
     *
     * @param options the options the player can choose from
     */
    public RankingAiPlayer(GameStatePhaseReducer phaseReducer, Player me) {
       this.phaseReducer = phaseReducer;
       this.me = me;
       this.stateRanking = this.createStateRanking(me);
    }
    protected abstract GameStateRanking createStateRanking(Player me);

    @Override
    public ReplayableMessage apply(GameState state) {
        if (messages.isEmpty()) {
            Double bestSoFar = Double.NEGATIVE_INFINITY;
            Queue<Tuple2<GameState, Vector<ReplayableMessage>>> queue = Queue.of(new Tuple2<>(state, Vector.empty()));

            while (!queue.isEmpty()) {
                Tuple2<Tuple2<GameState, Vector<ReplayableMessage>>, Queue<Tuple2<GameState, Vector<ReplayableMessage>>>> t = queue.dequeue();
                queue = t._2;
                Tuple2<GameState, Vector<ReplayableMessage>> item = t._1;
                GameState itemState = item._1;

                for (ReplayableMessage msg : getPossibleActions(itemState)) {
                    Vector<ReplayableMessage> chain = item._2.append(msg);
                    GameState newState = phaseReducer.apply(itemState, msg);
                    boolean end = newState.getActivePlayer() != me || newState.getTurnPlayer() != state.getTurnPlayer();

                    if (!end && msg instanceof PlaceTileMessage &&
                        newState.getLastPlaced().getTile().hasModifier(PortalCapability.MAGIC_PORTAL)) {
                        // hack to avoid bad performance on Portal tile
                        // rank just placement then rang meeple placement separately
                        // still not perfect because it can miss good on tile meeple placement
                        end = true;
                    }

                    if (end) {
                        Double ranking = stateRanking.apply(newState);

//                      String chainStr = chain.map(_msg -> _msg.getClass().getSimpleName()).toJavaStream().collect(Collectors.joining(", "));
//                      System.err.println(String.format(">>> %f\n%s", ranking, chainStr));

                        if (ranking > bestSoFar) {
                            bestSoFar = ranking;
                            messages = chain;
                        }
                    } else {
                        queue = queue.enqueue(new Tuple2<>(newState, chain));
                    }
                }
            }

            String chainStr = messages.map(_msg -> _msg.getClass().getSimpleName()).toJavaStream().collect(Collectors.joining(", "));
            System.out.println(String.format("Best ranking %s, %s", bestSoFar, chainStr));
        }

        ReplayableMessage msg = messages.get();
        messages = messages.drop(1);

        return msg;
    }

}
