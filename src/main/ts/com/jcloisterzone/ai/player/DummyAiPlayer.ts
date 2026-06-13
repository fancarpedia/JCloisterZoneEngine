import type { ReplayableMessage } from "../../io/message/ReplayableMessage.js";
import type { GameState } from "../../game/state/GameState.js";
import { AiPlayer } from "../AiPlayer.js";

/** Picks a random legal move. Port of `ai/player/DummyAiPlayer`. */
export class DummyAiPlayer extends AiPlayer {
  override apply(state: GameState): ReplayableMessage {
    const messages = this.getPossibleActions(state);
    return messages.get(Math.floor(Math.random() * messages.length()));
  }
}
