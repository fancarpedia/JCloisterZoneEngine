package com.jcloisterzone.integration.hills_and_sheep;

import com.jcloisterzone.game.state.GameState;
import com.jcloisterzone.integration.IntegrationTest;
import io.vavr.collection.Array;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class MultiCityMerge extends IntegrationTest {

    /**
     *  HS.CC!.v merging
     */
    @Test
    public void testMultiCityMerge() {
        GameState state = createGameState("saved-games/hills_and_sheep/multi_city_merge.jcz");

        Array<Integer> score = state.getPlayers().getScore();
        int alice = score.get(0);
        int bob = score.get(1);

        assertEquals(20, alice);
        assertEquals(0, bob);
    }

    /**
     *  HS.CC!.v merging
     */
    @Test
    public void testMultiCityMerge2() {
        GameState state = createGameState("saved-games/hills_and_sheep/multi_city_merge2.jcz");

        Array<Integer> score = state.getPlayers().getScore();
        int alice = score.get(0);
        int bob = score.get(1);

        assertEquals(8, alice);
        assertEquals(8, bob);
    }

    /**
     *  HS.CC!.v merging from other side
     */
    @Test
    public void testMultiCityMerge3() {
        GameState state = createGameState("saved-games/hills_and_sheep/multi_city_merge3.jcz");

        Array<Integer> score = state.getPlayers().getScore();
        int alice = score.get(0);
        int bob = score.get(1);

        assertEquals(8, alice);
        assertEquals(0, bob);
    }

    /**
     *  HS.CC!.v merging
     */
    @Test
    public void testMultiCityMergeOpen() {
        GameState state = createGameState("saved-games/hills_and_sheep/multi_city_merge_open.jcz");

        Array<Integer> score = state.getPlayers().getScore();
        int alice = score.get(0);
        int bob = score.get(1);

        assertEquals(0, alice);
        assertEquals(0, bob);
    }

    /**
     *  HS.CC!.v merging
     */
    @Test
    public void testMultiCityMergeAbbey() {
        GameState state = createGameState("saved-games/hills_and_sheep/multi_city_merge_abbey.jcz");

        Array<Integer> score = state.getPlayers().getScore();
        int alice = score.get(0);
        int bob = score.get(1);

        assertEquals(4, alice);
        assertEquals(4, bob);
    }

    /**
     *  HS.CC!.v merging
     */
    @Test
    public void testMultiCityMergeAbbey2() {
        GameState state = createGameState("saved-games/hills_and_sheep/multi_city_merge_abbey2.jcz");

        Array<Integer> score = state.getPlayers().getScore();
        int alice = score.get(0);
        int bob = score.get(1);

        assertEquals(24, alice);
        assertEquals(0, bob);
    }
}
