import { PlayEventMeta } from "../event/PlayEvent.js";
import { PlayerTurnEvent } from "../event/PlayerTurnEvent.js";
import type { Player } from "../Player.js";
import type { GameState } from "../game/state/GameState.js";
import type { Reducer } from "./Reducer.js";

/** Advances the turn to the next player (or a given one). */
export class SetNextPlayer implements Reducer {
  constructor(private readonly player: Player | null = null) {}

  apply(state: GameState): GameState {
    const p = this.player === null ? state.getTurnPlayer()!.getNextPlayer(state) : this.player;
    state = state.mapPlayers((ps) => ps.setTurnPlayerIndex(p.getIndex()));
    state = state.setTurnNumber(state.getTurnNumber() + 1);
    state = state.appendEvent(new PlayerTurnEvent(PlayEventMeta.createWithoutPlayer(), p));
    return state;
  }
}
