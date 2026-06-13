import type { ClassToken } from "../../../lang/Class.js";
import type { Arr, List } from "../../../io/vavr/SeqTypes.js";
import type { LinkedHashMap } from "../../../io/vavr/Map.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { FollowerCaptured } from "../event/FollowerCaptured.js";
import type { PlayEventMeta } from "../event/PlayEvent.js";
import { Follower } from "../figure/Follower.js";
import type { Meeple } from "../figure/Meeple.js";
import type { Capability } from "../game/Capability.js";
import { TowerCapability } from "../game/capability/TowerCapability.js";
import type { ReturnMeepleSource } from "../game/ReturnMeepleSource.js";
import type { GameState } from "../game/state/GameState.js";
import { UndeployMeeple } from "./UndeployMeeple.js";

const TOWER_CLS = TowerCapability as unknown as ClassToken<Capability<Arr<List<Follower>>>>;

/** Capture a follower into a tower's prison: the capturing player jails an opponent's
 *  follower (own followers just return to supply). */
export class CaptureMeeple extends UndeployMeeple {
  constructor(follower: Follower) {
    super(follower, true);
  }

  protected override primaryUndeploy(
    state: GameState,
    meta: PlayEventMeta,
    meeple: Meeple,
    source: FeaturePointer,
    returnMeepleSource: ReturnMeepleSource | null,
  ): GameState {
    const follower = meeple as Follower;
    const p = state.getPlayers().getPlayer(meta.getTriggeringPlayerIndex()!);
    if (p.equals(follower.getPlayer())) {
      return super.primaryUndeploy(state, meta, follower, source, returnMeepleSource);
    }
    const deployedMeeples = state.getDeployedMeeples();
    state = state.setDeployedMeeples(
      deployedMeeples.remove(follower) as LinkedHashMap<Meeple, FeaturePointer>,
    );
    state = state.mapCapabilityModel<Arr<List<Follower>>>(TOWER_CLS, (model) =>
      model.update(p.getIndex(), model.get(p.getIndex()).append(follower) as List<Follower>) as Arr<List<Follower>>,
    );
    state = state.appendEvent(new FollowerCaptured(meta, follower, source));
    return state;
  }
}
