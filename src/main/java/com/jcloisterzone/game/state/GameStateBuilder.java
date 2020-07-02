package com.jcloisterzone.game.state;

import com.jcloisterzone.Player;
import com.jcloisterzone.board.*;
import com.jcloisterzone.config.Config;
import com.jcloisterzone.event.play.PlayEvent.PlayEventMeta;
import com.jcloisterzone.event.play.PlayerTurnEvent;
import com.jcloisterzone.figure.Follower;
import com.jcloisterzone.figure.MeepleIdProvider;
import com.jcloisterzone.figure.Special;
import com.jcloisterzone.game.Capability;
import com.jcloisterzone.game.GameSetup;
import com.jcloisterzone.game.PlayerSlot;
import com.jcloisterzone.reducers.PlaceTile;
import com.jcloisterzone.wsio.message.GameSetupMessage.PlacedTileItem;
import io.vavr.Predicates;
import io.vavr.Tuple2;
import io.vavr.collection.Array;
import io.vavr.collection.LinkedHashMap;
import io.vavr.collection.Seq;
import io.vavr.collection.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Arrays;
import java.util.Map;


public class GameStateBuilder {

//    private final static class PlayerSlotComparator implements Comparator<PlayerSlot> {
//        @Override
//        public int compare(PlayerSlot o1, PlayerSlot o2) {
//            if (o1.getSerial() == null) {
//                return o2.getSerial() == null ? 0 : 1;
//            }
//            if (o2.getSerial() == null) return -1;
//            if (o1.getSerial() < o2.getSerial()) return -1;
//            if (o1.getSerial() > o2.getSerial()) return 1;
//            return 0;
//        }
//    }

    protected final transient Logger logger = LoggerFactory.getLogger(getClass());

    private final GameSetup setup;
    private final PlayerSlot[] slots;
    private final Config config;

    private Array<Player> players;
    private Map<String, Object> gameAnnotations;

    private GameState state;


    public GameStateBuilder(GameSetup setup, PlayerSlot[] slots, Config config) {
        this.setup = setup;
        this.slots = slots;
        this.config = config;
    }

    public GameState createInitialState() {
        //temporary code should be configured by player as rules
        io.vavr.collection.List<Capability<?>> capabilities = createCapabilities(setup.getCapabilities());
        createPlayers();

        state = GameState.createInitial(
            setup.getRules(), capabilities, players, 0
        );

        state = state.mapPlayers(ps ->
            ps.setFollowers(
                players.map(p -> createPlayerFollowers(p, capabilities))
            ).setSpecialMeeples(
                players.map(p -> createPlayerSpecialMeeples(p, capabilities))
            )
        );

        createTilePack();

        for (Capability<?> cap : state.getCapabilities().toSeq()) {
            state = cap.onStartGame(state);
        }

        //prepareAiPlayers(muteAi);

        state = processGameAnnotations(state);
        return state;
    }

    public GameState createReadyState(GameState state) {
        for (PlacedTileItem pt : setup.getStart()) {
            Tuple2<Tile, TilePack> draw = state.getTilePack().drawTile(pt.getTile());
            Rotation rot = Rotation.valueOf("R" + pt.getRotation());
            state = state.setTilePack(draw._2);
            state = (new PlaceTile(draw._1, new Position(pt.getX(), pt.getY()), rot)).apply(state);
        }
        state = state.appendEvent(new PlayerTurnEvent(PlayEventMeta.createWithoutPlayer(), state.getTurnPlayer()));
        return state;
    }

    /**
     *  Debug helper, allows loading integration tests in UI
     */
    @SuppressWarnings({ "unchecked", "rawtypes" })
    private GameState processGameAnnotations(GameState state) {
        if (gameAnnotations == null) {
            return state;
        }
        Map<String, Object> tilePackAnnotation = (Map) gameAnnotations.get("tilePack");
        if (tilePackAnnotation != null) {
            try {
                String clsName = (String) tilePackAnnotation.get("className");
                Object params = tilePackAnnotation.get("params");
                TilePack replacement = (TilePack) Class.forName(clsName).getConstructor(LinkedHashMap.class, java.util.Map.class).newInstance(state.getTilePack().getGroups(), params);
                state = state.setTilePack(replacement);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        return state;
    }

    private void createPlayers() {
        this.players = Stream.ofAll(Arrays.asList(slots))
            .filter(Predicates.isNotNull())
            .filter(PlayerSlot::isOccupied)
            .sortBy(PlayerSlot::getSerial)
            .foldLeft(Array.empty(), (arr, slot) ->
               arr.append(new Player(slot.getNickname(), arr.size(), slot))
            );

        if (this.players.isEmpty()) {
            throw new IllegalStateException("No players in game");
        }
    }

    private void createTilePack() {
        TilePackBuilder tilePackBuilder = new TilePackBuilder();
        tilePackBuilder.setGameState(state);
        tilePackBuilder.setConfig(config);
        tilePackBuilder.setTileSets(setup.getTileSets());

        try {
            TilePack tilePack = tilePackBuilder.createTilePack();
            state = state.setTilePack(tilePack);
        } catch (IOException e) {
            throw new RuntimeException("Can't parse tile definitions", e);
        }
    }

    private Capability<?> createCapabilityInstance(Class<? extends Capability<?>> clazz) {
        try {
            return clazz.newInstance();
        } catch (Exception e) {
            throw new RuntimeException("Unable to create " + clazz.getSimpleName(), e);
        }
    }

    public io.vavr.collection.List<Capability<?>> createCapabilities(io.vavr.collection.Set<Class<? extends Capability<?>>> classes) {
        return io.vavr.collection.List.narrow(
            classes.map(this::createCapabilityInstance).toList()
        );
    }

    private io.vavr.collection.List<Follower> createPlayerFollowers(Player p, Seq<Capability<?>> capabilities) {
        MeepleIdProvider idProvider = new MeepleIdProvider(p);
        io.vavr.collection.List<Follower> followers = io.vavr.collection.List.empty();
        followers = followers.appendAll(capabilities.flatMap(c -> c.createPlayerFollowers(p, idProvider)));
        return followers;
    }

    public Seq<Special> createPlayerSpecialMeeples(Player p, Seq<Capability<?>> capabilities) {
        MeepleIdProvider idProvider = new MeepleIdProvider(p);
        return capabilities.flatMap(c -> c.createPlayerSpecialMeeples(p, idProvider));
    }

    public Map<String, Object> getGameAnnotations() {
        return gameAnnotations;
    }

    public void setGameAnnotations(Map<String, Object> gameAnnotations) {
        this.gameAnnotations = gameAnnotations;
    }
}