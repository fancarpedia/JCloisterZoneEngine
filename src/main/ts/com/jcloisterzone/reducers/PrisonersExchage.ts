import type { ClassToken } from "../../../lang/Class.js";
import type { Arr, List } from "../../../io/vavr/SeqTypes.js";
import { PrisonersExchangeEvent } from "../event/PrisonersExchangeEvent.js";
import { PlayEventMeta } from "../event/PlayEvent.js";
import type { Follower } from "../figure/Follower.js";
import type { Capability } from "../game/Capability.js";
import { TowerCapability } from "../game/capability/TowerCapability.js";
import type { GameState } from "../game/state/GameState.js";
import type { Reducer } from "./Reducer.js";

const TOWER_CLS = TowerCapability as unknown as ClassToken<Capability<Arr<List<Follower>>>>;

/** Swap two captured followers back to their owners (Tower auto-exchange). */
export class PrisonersExchage implements Reducer {
  constructor(
    private readonly a: Follower,
    private readonly b: Follower,
  ) {}

  apply(state: GameState): GameState {
    const a = this.a;
    const b = this.b;
    state = state.mapCapabilityModel<Arr<List<Follower>>>(TOWER_CLS, (model) => {
      const bi = b.getPlayer().getIndex();
      const ai = a.getPlayer().getIndex();
      model = model.update(bi, model.get(bi).remove(a) as List<Follower>) as Arr<List<Follower>>;
      model = model.update(ai, model.get(ai).remove(b) as List<Follower>) as Arr<List<Follower>>;
      return model;
    });
    state = state.appendEvent(new PrisonersExchangeEvent(PlayEventMeta.createWithoutPlayer(), a, b));
    return state;
  }
}
