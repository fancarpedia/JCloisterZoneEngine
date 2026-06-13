import type { GameStatePhaseReducer } from "../../game/GameStatePhaseReducer.js";
import type { Player } from "../../Player.js";
import type { GameStateRanking } from "../GameStateRanking.js";
import { LegacyRanking } from "./LegacyRanking.js";
import { RankingAiPlayer } from "./RankingAiPlayer.js";

/** RankingAiPlayer using the legacy heuristic. Port of `ai/player/LegacyAiPlayer`. */
export class LegacyAiPlayer extends RankingAiPlayer {
  constructor(phaseReducer: GameStatePhaseReducer, me: Player) {
    super(phaseReducer, me);
  }

  protected override createStateRanking(me: Player): GameStateRanking {
    return new LegacyRanking(me);
  }
}
