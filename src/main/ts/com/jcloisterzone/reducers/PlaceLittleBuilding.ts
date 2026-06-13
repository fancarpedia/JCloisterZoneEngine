import type { Map as VMap } from "../../../io/vavr/Map.js";
import type { Position } from "../board/Position.js";
import { PlayEventMeta } from "../event/PlayEvent.js";
import { TokenPlacedEvent } from "../event/TokenPlacedEvent.js";
import { LittleBuildingsCapability } from "../game/capability/LittleBuildingsCapability.js";
import type { GameState } from "../game/state/GameState.js";
import type { Reducer } from "./Reducer.js";

type LB = LittleBuildingsCapability.LittleBuilding;

/** Places a Little Building token onto a tile (port of PlaceLittleBuilding). */
export class PlaceLittleBuilding implements Reducer {
  constructor(
    private readonly token: LB,
    private readonly pos: Position,
  ) {}

  apply(state: GameState): GameState {
    state = state.mapCapabilityModel<VMap<Position, LB>>(
      LittleBuildingsCapability as unknown as import("../../../lang/Class.js").ClassToken<
        import("../game/Capability.js").Capability<VMap<Position, LB>>
      >,
      (placedTokens) => placedTokens.put(this.pos, this.token),
    );
    state = state.appendEvent(
      new TokenPlacedEvent(PlayEventMeta.createWithActivePlayer(state), this.token, this.pos),
    );
    return state;
  }
}
