import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { MeeplePointer } from "../../board/pointer/MeeplePointer.js";
import { City } from "../../feature/City.js";
import { ReturnMeepleAction } from "../../action/ReturnMeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { Capability } from "../Capability.js";
import { ReturnMeepleSource } from "../ReturnMeepleSource.js";
import { Flag } from "../state/Flag.js";
import type { GameState } from "../state/GameState.js";

/** Princess (Princess & the Dragon): placing a tile that extends a city with a princess pennant
 *  lets the turn player remove a follower from that city instead of deploying. */
export class PrincessCapability extends Capability<void> {
  override onActionPhaseEntered(state: GameState): GameState {
    if (state.getFlags().contains(Flag.NO_PHANTOM)) {
      return state;
    }
    const lastTile = state.getLastPlaced()!;
    let options: Set<MeeplePointer> = HashSet.empty<MeeplePointer>();
    for (const t of state.getTileFeatures2(lastTile.getPosition())) {
      if (!(t._2 instanceof City)) continue;
      const part = lastTile.getInitialFeaturePartOf(t._1.getLocation()!)!._2 as City;
      if (!part.hasModifier(state, City.PRINCESS)) continue;
      for (const ft of (t._2 as City).getFollowers2(state)) {
        options = options.add(new MeeplePointer(ft));
      }
    }

    if (options.isEmpty()) {
      return state;
    }
    return state.appendAction(
      new ReturnMeepleAction(options, ReturnMeepleSource.PRINCESS) as unknown as PlayerAction<unknown>,
    );
  }
}

Capability.register(PrincessCapability);
