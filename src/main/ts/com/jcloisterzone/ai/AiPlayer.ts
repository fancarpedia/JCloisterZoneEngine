import { Vector } from "../../../io/vavr/SeqTypes.js";
import { ConfirmAction } from "../action/ConfirmAction.js";
import type { PlayerAction } from "../action/PlayerAction.js";
import { CommitMessage } from "../io/message/CommitMessage.js";
import { PassMessage } from "../io/message/PassMessage.js";
import type { ReplayableMessage } from "../io/message/ReplayableMessage.js";
import type { GameState } from "../game/state/GameState.js";

/** Base for engine-side AI players: picks a move for the active player.
 *  Port of Java's `AiPlayer extends Function1<GameState, ReplayableMessage>`. */
export abstract class AiPlayer {
  /** Compute the move (or first move of a chain) for the given state. */
  abstract apply(state: GameState): ReplayableMessage;

  /** All legal next messages from the current player actions (each action's options
   *  mapped via `select`, ConfirmAction → COMMIT, plus PASS when allowed). */
  getPossibleActions(state: GameState): Vector<ReplayableMessage> {
    const as = state.getPlayerActions()!;
    let messages = as.getActions().flatMap((action) => {
      if (action instanceof ConfirmAction) {
        return Vector.of(new CommitMessage() as unknown as ReplayableMessage);
      }
      const a = action as PlayerAction<unknown>;
      return a
        .getOptions()
        .toVector()
        .map((o) => a.select(o) as ReplayableMessage);
    }) as Vector<ReplayableMessage>;
    if (as.isPassAllowed()) {
      messages = messages.append(new PassMessage() as unknown as ReplayableMessage) as Vector<ReplayableMessage>;
    }
    return messages;
  }
}
