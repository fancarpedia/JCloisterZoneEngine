import type { List } from "../../../io/vavr/SeqTypes.js";
import type { ReplayableMessage } from "../io/message/ReplayableMessage.js";
import type { GameState } from "./state/GameState.js";

/** A snapshot (state + replay) kept so a move can be undone. Port of UndoHistoryItem. */
export class UndoHistoryItem {
  constructor(
    private readonly state: GameState,
    private readonly replay: List<ReplayableMessage>,
  ) {}

  getState(): GameState {
    return this.state;
  }

  getReplay(): List<ReplayableMessage> {
    return this.replay;
  }
}
