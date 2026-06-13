import type { LinkedHashMap } from "../../../io/vavr/Map.js";
import { type Set } from "../../../io/vavr/Set.js";
import type { ClassToken } from "../../../lang/Class.js";
import { Edge } from "../board/Edge.js";
import { Rotation } from "../board/Rotation.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { PlayEventMeta } from "../event/PlayEvent.js";
import { TokenPlacedEvent } from "../event/TokenPlacedEvent.js";
import { Bridge } from "../feature/Bridge.js";
import { Road } from "../feature/Road.js";
import type { Capability } from "../game/Capability.js";
import { BridgeCapability } from "../game/capability/BridgeCapability.js";
import type { GameState } from "../game/state/GameState.js";
import type { Reducer } from "./Reducer.js";

const BRIDGE_CLS = BridgeCapability as unknown as ClassToken<Capability<Set<FeaturePointer>>>;

/** Places a bridge token: rotates the host tile's bridge feature in, builds the
 *  bridge road (closing edges that abut non-road features), and records it. */
export class PlaceBridge implements Reducer {
  constructor(
    private readonly ptr: FeaturePointer,
    private readonly silent: boolean = false,
  ) {}

  apply(state: GameState): GameState {
    const bridgePos = this.ptr.getPosition();
    const bridgeLoc = this.ptr.getLocation()!;

    const placedTiles = state.getPlacedTiles();
    let ptile = placedTiles.get(bridgePos).get();
    const tileRotation = ptile.getRotation();
    ptile = ptile.mapTile((t) => t.addBridge(bridgeLoc.rotateCCW(tileRotation)));
    state = state.setPlacedTiles(
      placedTiles.put(bridgePos, ptile) as LinkedHashMap<typeof bridgePos, typeof ptile>,
    );

    const bridge = new Bridge(bridgeLoc);
    // the bridge feature is already rotated; placed as if the tile has no rotation
    let bridgeRoad = bridge.placeOnBoard(bridgePos, Rotation.R0) as Road;

    for (const side of bridgeLoc.splitToSides()) {
      const adj = bridgePos.add(side);
      const f = state.getFeaturePartOf(adj, side.rev());
      if (f !== null && !(f instanceof Road)) {
        // abuts a city gate — close that edge of the bridge road
        bridgeRoad = bridgeRoad.closeEdge(new Edge(bridgePos, adj));
      }
    }

    const road = bridgeRoad;
    state = state.mapFeatureMap((m) => m.put(bridgePos, m.get(bridgePos).get().put(this.ptr, road)));
    state = state.mapCapabilityModel<Set<FeaturePointer>>(BRIDGE_CLS, (model) => model.add(this.ptr));

    if (!this.silent) {
      state = state.appendEvent(
        new TokenPlacedEvent(
          PlayEventMeta.createWithActivePlayer(state),
          BridgeCapability.BridgeToken.BRIDGE,
          this.ptr,
        ),
      );
    }
    return state;
  }
}
