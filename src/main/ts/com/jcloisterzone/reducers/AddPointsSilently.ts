import type { Player } from "../Player.js";
import type { GameState } from "../game/state/GameState.js";
import type { Reducer } from "./Reducer.js";

/** Adds points without emitting any score event (bazaar auction payments). */
export class AddPointsSilently implements Reducer {
  constructor(
    private readonly player: Player,
    private readonly points: number,
  ) {}

  apply(state: GameState): GameState {
    if (this.points === 0) {
      return state;
    }
    const idx = this.player.getIndex();
    return state.mapPlayers((ps) => {
      let score = ps.getScore();
      score = score.update(idx, score.get(idx) + this.points) as typeof score;
      return ps.setScore(score);
    });
  }
}
