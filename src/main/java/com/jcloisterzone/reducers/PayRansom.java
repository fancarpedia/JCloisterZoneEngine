package com.jcloisterzone.reducers;

import com.jcloisterzone.Player;
import com.jcloisterzone.event.ExprItem;
import com.jcloisterzone.event.PlayEvent;
import com.jcloisterzone.event.PointsExpression;
import com.jcloisterzone.event.RansomPaidEvent;
import com.jcloisterzone.event.ScoreEvent;
import com.jcloisterzone.figure.Follower;
import com.jcloisterzone.game.capability.TowerCapability;
import com.jcloisterzone.game.state.Flag;
import com.jcloisterzone.game.state.GameState;
import io.vavr.collection.Array;
import io.vavr.collection.List;

import java.util.function.Predicate;

public class PayRansom implements Reducer {

    private final String meepleId;

    public PayRansom(String meepleId) {
        this.meepleId = meepleId;
    }

    public GameState apply(GameState state) {
        if (state.hasFlag(Flag.RANSOM_PAID)) {
            throw new IllegalStateException("Ransom can be paid only once a turn.");
        }

        Player player = state.getActivePlayer();
        if (state.getPlayers().getScore().get(player.getIndex()) < TowerCapability.RANSOM_POINTS) {
            throw new IllegalStateException("Not enough points to pay ransom.");
        }

        Predicate<Follower> pred = f -> f.getId().equals(meepleId);
        Array<List<Follower>> model = state.getCapabilityModel(TowerCapability.class);
        Follower follower = null;
        Player jailer = null;

        for (int i = 0; i < model.length(); i++) {
            follower = model.get(i).find(pred).getOrNull();
            if (follower != null) {
                jailer = state.getPlayers().getPlayer(i);
                break;
            }
        }

        if (follower == null) {
            throw new IllegalArgumentException(String.format("No such prisoner %s.", meepleId));
        }
        if (!follower.getPlayer().equals(player)) {
            throw new IllegalArgumentException("Cannot pay ransom for opponent's follower.");
        }

        Player _jailer = jailer;
        Follower _follower = follower;
        state = state.mapCapabilityModel(TowerCapability.class, m ->
            m.update(_jailer.getIndex(), l -> l.remove(_follower))
        );
        state = state.addFlag(Flag.RANSOM_PAID);

        List<ScoreEvent.ReceivedPoints> points = List.empty();
        points = points.append(new ScoreEvent.ReceivedPoints(new PointsExpression("ransompaid.payment", new ExprItem(1, "meeples", -1 * TowerCapability.RANSOM_POINTS)), player, null));
        points = points.append(new ScoreEvent.ReceivedPoints(new PointsExpression("ransompaid.income", new ExprItem(1, "meeples", TowerCapability.RANSOM_POINTS)), jailer, null));
        state = (new AddPoints(points, false)).apply(state);
        state = state.appendEvent(
            new RansomPaidEvent(PlayEvent.PlayEventMeta.createWithActivePlayer(state), follower, jailer)
        );
        return state;
    }

}

