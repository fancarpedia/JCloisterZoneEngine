import { List } from "../../../io/vavr/SeqTypes.js";
import { UndoHistoryItem } from "../game/UndoHistoryItem.js";
import type { ReplayableMessage } from "../io/message/ReplayableMessage.js";
import type { GameState } from "../game/state/GameState.js";

/** Holds the current state plus the replay log and an undo stack. Port of Game.java. */
export class Game {
  private state!: GameState;
  private replay: List<ReplayableMessage> = List.empty<ReplayableMessage>();
  private undoHistory: List<UndoHistoryItem> = List.empty<UndoHistoryItem>();

  replaceState(state: GameState): void {
    this.state = state;
  }

  markUndo(): void {
    this.undoHistory = this.undoHistory.prepend(
      new UndoHistoryItem(this.state, this.replay),
    ) as List<UndoHistoryItem>;
  }

  clearUndo(): void {
    this.undoHistory = List.empty<UndoHistoryItem>();
  }

  isUndoAllowed(): boolean {
    return !this.undoHistory.isEmpty();
  }

  getUndoDepth(): number {
    return this.undoHistory.size();
  }

  undo(): void {
    if (this.undoHistory.isEmpty()) {
      throw new Error("IllegalState: nothing to undo");
    }
    const head = this.undoHistory.head();
    this.undoHistory = this.undoHistory.tail() as List<UndoHistoryItem>;
    this.replay = head.getReplay();
    this.replaceState(head.getState());
  }

  getReplay(): List<ReplayableMessage> {
    return this.replay;
  }

  setReplay(replay: List<ReplayableMessage>): void {
    this.replay = replay;
  }

  getState(): GameState {
    return this.state;
  }
}
