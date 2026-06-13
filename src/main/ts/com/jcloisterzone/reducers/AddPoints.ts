import type { Arr } from "../../../io/vavr/SeqTypes.js";
import { List } from "../../../io/vavr/SeqTypes.js";
import { ScoreEvent, type ReceivedPoints } from "../event/ScoreEvent.js";
import type { GameState } from "../game/state/GameState.js";
import type { Reducer } from "./Reducer.js";

/** Appends a ScoreEvent and adds its points to player scores. */
export class AddPoints implements Reducer {
  private readonly scoreEvent: ScoreEvent;

  constructor(points: List<ReceivedPoints> | ReceivedPoints, landscapeSource: boolean, isFinal = false) {
    this.scoreEvent = new ScoreEvent(points, landscapeSource, isFinal);
  }

  apply(state: GameState): GameState {
    state = state.appendEvent(this.scoreEvent);
    for (const pts of this.scoreEvent.getPoints()) {
      if (pts.getPoints() === 0) continue;
      const idx = pts.getPlayer().getIndex();
      state = state.mapPlayers((ps) => {
        let score = ps.getScore();
        score = score.update(idx, score.get(idx) + pts.getPoints()) as Arr<number>;
        return ps.setScore(score);
      });
    }
    return state;
  }
}
