import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { PlayEventMeta } from "../event/PlayEvent.js";
import { TokenPlacedEvent } from "../event/TokenPlacedEvent.js";
import { Road } from "../feature/Road.js";
import { FerriesCapability } from "../game/capability/FerriesCapability.js";
import type { FerriesCapabilityModel } from "../game/capability/FerriesCapabilityModel.js";
import type { GameState } from "../game/state/GameState.js";
import type { Reducer } from "./Reducer.js";

/** Places a ferry: registers it in the model and merges the two road ends it joins. */
export class PlaceFerry implements Reducer {
  constructor(private readonly ferry: FeaturePointer) {}

  apply(state: GameState): GameState {
    const _state = state;
    state = state.mapCapabilityModel<FerriesCapabilityModel>(
      FerriesCapability,
      (m) => m.addFerry(this.ferry),
    );

    const ends = this.ferry
      .getLocation()!
      .splitToSides()
      .map((l) => _state.getFeature(this.ferry.setLocation(l)) as Road);
    const r1 = ends.get(0);
    const r2 = ends.get(1);
    if (r1 !== r2) {
      const merged = r1.merge(r2);
      state = state.mapFeatureMap((m) => {
        for (const fp of merged.getPlaces()) {
          const pos = fp.getPosition();
          m = m.put(pos, m.get(pos).get().put(fp, merged));
        }
        return m;
      });
    }

    state = state.appendEvent(
      new TokenPlacedEvent(
        PlayEventMeta.createWithActivePlayer(state),
        FerriesCapability.FerryToken.FERRY,
        this.ferry,
      ),
    );
    return state;
  }
}
