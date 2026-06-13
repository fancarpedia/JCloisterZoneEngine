import { HashMap, type Map as VMap } from "../../../io/vavr/Map.js";
import type { ClassToken } from "../../../lang/Class.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { PlayEventMeta } from "../event/PlayEvent.js";
import { TokenPlacedEvent } from "../event/TokenPlacedEvent.js";
import type { Feature } from "../feature/Feature.js";
import { Road } from "../feature/Road.js";
import { Capability } from "../game/Capability.js";
import type { TunnelCapability } from "../game/capability/TunnelCapability.js";
import { Flag } from "../game/state/Flag.js";
import type { GameState } from "../game/state/GameState.js";
import { PlacedTunnelToken } from "../game/state/PlacedTunnelToken.js";
import type { Reducer } from "./Reducer.js";

type TunnelModel = VMap<FeaturePointer, PlacedTunnelToken>;
// tryClassForName avoids a PlaceTunnel <-> TunnelCapability import cycle (which would
// leave the class token undefined and the model lookup missing).
const TUNNEL_CLS = (): ClassToken<Capability<TunnelModel>> =>
  Capability.tryClassForName("Tunnel") as unknown as ClassToken<Capability<TunnelModel>>;

/** Places a tunnel token on an open tunnel end; when the matching second end is
 *  already placed, the two road ends are joined into one road. */
export class PlaceTunnel implements Reducer {
  constructor(
    private readonly token: TunnelCapability.Tunnel,
    private readonly ptr: FeaturePointer,
  ) {}

  apply(state: GameState): GameState {
    const player = state.getActivePlayer()!;
    const placedToken = new PlacedTunnelToken(player.getIndex(), this.token);
    const tunnels = state.getCapabilityModel<TunnelModel>(TUNNEL_CLS());
    const secondEnd = tunnels
      .find((t) => t._2 !== null && t._2.equals(placedToken))
      .map((t) => t._1)
      .getOrNull();

    if (secondEnd !== null) {
      const r1 = state.getFeature(this.ptr) as Road;
      const r2 = state.getFeature(secondEnd) as Road;
      const merged = r1.connectTunnels(r2, this.ptr, secondEnd);
      let fpUpdate: VMap<FeaturePointer, Feature> = HashMap.empty();
      for (const fp of merged.getPlaces()) fpUpdate = fpUpdate.put(fp, merged as unknown as Feature);
      state = state.updateFeatureMap(fpUpdate);
    }

    state = state.addFlag(Flag.TUNNEL_PLACED);
    state = state.setCapabilityModel<TunnelModel>(TUNNEL_CLS(), tunnels.put(this.ptr, placedToken) as TunnelModel);
    state = state.appendEvent(new TokenPlacedEvent(PlayEventMeta.createWithActivePlayer(state), this.token, this.ptr));
    return state;
  }
}
