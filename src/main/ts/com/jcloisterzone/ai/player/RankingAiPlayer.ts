import type { GameStatePhaseReducer } from "../../game/GameStatePhaseReducer.js";
import { PortalCapability } from "../../game/capability/PortalCapability.js";
import type { Message } from "../../io/message/Message.js";
import { PlaceTileMessage } from "../../io/message/PlaceTileMessage.js";
import type { ReplayableMessage } from "../../io/message/ReplayableMessage.js";
import type { Player } from "../../Player.js";
import type { GameState } from "../../game/state/GameState.js";
import { AiPlayer } from "../AiPlayer.js";
import type { GameStateRanking } from "../GameStateRanking.js";

/** AI that searches all move-chains for the current player's turn-part and keeps the
 *  chain whose resulting state ranks highest. Returns the chain one message per call.
 *  Port of `ai/player/RankingAiPlayer`. */
export abstract class RankingAiPlayer extends AiPlayer {
  private readonly stateRanking: GameStateRanking;
  private readonly phaseReducer: GameStatePhaseReducer;
  private readonly me: Player;
  private messages: ReplayableMessage[] = [];

  constructor(phaseReducer: GameStatePhaseReducer, me: Player) {
    super();
    this.phaseReducer = phaseReducer;
    this.me = me;
    this.stateRanking = this.createStateRanking(me);
  }

  protected abstract createStateRanking(me: Player): GameStateRanking;

  override apply(state: GameState): ReplayableMessage {
    if (this.messages.length === 0) {
      let bestSoFar = Number.NEGATIVE_INFINITY;
      const queue: Array<[GameState, ReplayableMessage[]]> = [[state, []]];
      while (queue.length > 0) {
        const [itemState, chain] = queue.shift()!;
        for (const msg of this.getPossibleActions(itemState)) {
          const newChain = chain.concat(msg);
          const newState = this.phaseReducer.apply(itemState, msg as unknown as Message);
          let end =
            newState.getActivePlayer() === null ||
            newState.getActivePlayer()!.getIndex() !== this.me.getIndex() ||
            newState.getTurnPlayer()!.getIndex() !== state.getTurnPlayer()!.getIndex();
          if (
            !end &&
            msg instanceof PlaceTileMessage &&
            newState.getLastPlaced()!.getTile().hasModifier(PortalCapability.MAGIC_PORTAL)
          ) {
            // hack to avoid bad performance on a Portal tile: rank placement then rank
            // meeple placement separately (may miss a good on-tile meeple placement)
            end = true;
          }
          if (end) {
            const ranking = this.stateRanking.apply(newState);
            if (ranking > bestSoFar) {
              bestSoFar = ranking;
              this.messages = newChain;
            }
          } else {
            queue.push([newState, newChain]);
          }
        }
      }
    }
    const msg = this.messages[0];
    this.messages = this.messages.slice(1);
    return msg;
  }
}
