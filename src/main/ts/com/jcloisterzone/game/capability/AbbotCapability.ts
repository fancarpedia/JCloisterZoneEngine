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
    const actions = state.getPlayerActions()!;
    // Collect every returnable abbot into ONE action with several options. Appending inside the
    // loop produced a separate "return abbot" item per abbot, so a player holding two or three
    // showed the same action twice/three times. This matches how Princess / Robber's Son /
    // Festival build their returns: gather the pointers, append a single ReturnMeepleAction.
    const options: MeeplePointer[] = [];
    for (const t of state.getDeployedMeeples()) {
      const meeple = t._1;
      if (!(meeple instanceof Abbot) || !meeple.getPlayer().equals(actions.getPlayer())) continue;

      const feature = state.getFeature(t._2);
      // Monastic is an erased interface → match the concrete monastic features
      if (!(feature instanceof Monastery || feature instanceof Garden)) continue;
      if ((feature as unknown as { isCompleted(s: GameState): boolean }).isCompleted(state)) continue;

      options.push(new MeeplePointer(t._2, meeple.getId()));
    }
    if (!options.length) return state;
    return state.setPlayerActions(
      actions.appendAction(
        new ReturnMeepleAction(
          HashSet.ofAll(options),
          ReturnMeepleSource.ABBOT_RETURN,
        ) as unknown as PlayerAction<unknown>,
      ),
    );
  }
}

Capability.register(AbbotCapability);
