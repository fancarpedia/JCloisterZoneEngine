import { HashSet } from "../../../../io/vavr/Set.js";
import { MeeplePointer } from "../../board/pointer/MeeplePointer.js";
import { ReturnMeepleAction } from "../../action/ReturnMeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { Garden } from "../../feature/Garden.js";
import { Monastery } from "../../feature/Monastery.js";
import { Abbot } from "../../figure/Abbot.js";
import { Capability } from "../Capability.js";
import { ReturnMeepleSource } from "../ReturnMeepleSource.js";
import type { GameState } from "../state/GameState.js";

/** The Abbot (German Monasteries) — while an abbot sits on an INCOMPLETE monastic
 *  feature, its owner may voluntarily return it to score (a ReturnMeeple action). */
export class AbbotCapability extends Capability<void> {
  override onActionPhaseEntered(state: GameState): GameState {
    let actions = state.getPlayerActions()!;
    for (const t of state.getDeployedMeeples()) {
      const meeple = t._1;
      if (!(meeple instanceof Abbot) || !meeple.getPlayer().equals(actions.getPlayer())) continue;

      const feature = state.getFeature(t._2);
      // Monastic is an erased interface → match the concrete monastic features
      if (!(feature instanceof Monastery || feature instanceof Garden)) continue;
      if ((feature as unknown as { isCompleted(s: GameState): boolean }).isCompleted(state)) continue;

      actions = actions.appendAction(
        new ReturnMeepleAction(
          HashSet.of(new MeeplePointer(t._2, meeple.getId())),
          ReturnMeepleSource.ABBOT_RETURN,
        ) as unknown as PlayerAction<unknown>,
      );
      state = state.setPlayerActions(actions);
    }
    return state;
  }
}

Capability.register(AbbotCapability);
