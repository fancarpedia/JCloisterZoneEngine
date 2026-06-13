import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { PlacementOption } from "../../board/PlacementOption.js";
import { Rotation } from "../../board/Rotation.js";
import type { Player } from "../../Player.js";
import { TilePlacementAction } from "../../action/TilePlacementAction.js";
import type { PlaceTileMessage } from "../../io/message/PlaceTileMessage.js";
import { PlaceTile } from "../../reducers/PlaceTile.js";
import { AbbeyCapability } from "../capability/AbbeyCapability.js";
import type { GameState } from "../state/GameState.js";
import { Phase } from "./Phase.js";

/** Shared logic for the two abbey phases (during-game and end-game): build the
 *  "place an abbey into a hole" action, and apply the chosen abbey placement. */
export abstract class AbstractAbbeyPhase extends Phase {
  /** Action offering the abbey tile in every hole×rotation that all capabilities
   *  permit, or null if none are legal. */
  protected createAbbeyAction(state: GameState): TilePlacementAction | null {
    const options: PlacementOption[] = [];
    for (const t of state.getHoles()) {
      for (const r of Rotation.values()) {
        const tp = new PlacementOption(t._1, r, null);
        let allowed = true;
        for (const cap of state.getCapabilities().toSeq()) {
          if (!cap.isTilePlacementAllowed(state, AbbeyCapability.ABBEY_TILE, tp)) {
            allowed = false;
            break;
          }
        }
        if (allowed) options.push(tp);
      }
    }
    if (options.length === 0) return null;
    const set: Set<PlacementOption> = HashSet.ofAll(options);
    return new TilePlacementAction(AbbeyCapability.ABBEY_TILE, set);
  }

  protected applyPlaceTile(state: GameState, msg: PlaceTileMessage): GameState {
    if (msg.getTileId() !== AbbeyCapability.ABBEY_TILE_ID) {
      throw new Error("Only abbey can be placed.");
    }
    const player: Player = state.getActivePlayer()!;
    state = state.mapPlayers((ps) =>
      ps.addTokenCount(player.getIndex(), AbbeyCapability.AbbeyToken.ABBEY_TILE, -1),
    );
    state = new PlaceTile(AbbeyCapability.ABBEY_TILE, msg.getPosition()!, msg.getRotation()!).apply(state);
    state = this.clearActions(state);
    return state;
  }
}
