import { Arr, List, Stream } from "../../../io/vavr/SeqTypes.js";
import type { ClassToken } from "../../../lang/Class.js";
import type { Player } from "../Player.js";
import { Castle } from "../feature/Castle.js";
import type { Scoreable } from "../feature/Scoreable.js";
import { Capability } from "../game/Capability.js";
import type { GameState } from "../game/state/GameState.js";
import { Meeple } from "./Meeple.js";

/** A follower meeple (the standard scoring meeple). */
export abstract class Follower extends Meeple {
  constructor(id: string, player: Player) {
    super(id, player);
  }

  override isFollower(): boolean {
    return true;
  }

  getPower(state: GameState, feature: Scoreable): number {
    return 1;
  }

  override canBeEatenByDragon(state: GameState): boolean {
    return !(this.getFeature(state) instanceof Castle);
  }

  isCaptured(state: GameState): boolean {
    // resolve TowerCapability by name to avoid a Follower<->TowerCapability import cycle
    const towerCls = Capability.tryClassForName("Tower");
    if (towerCls === null || !state.hasCapability(towerCls)) return false;
    const model = state.getCapabilityModel<Arr<List<Follower>>>(
      towerCls as unknown as ClassToken<Capability<Arr<List<Follower>>>>,
    );
    return model !== null && Stream.concat<Follower>(...model.toArray()).find((f) => f === this).isDefined();
  }

  override isInSupply(state: GameState): boolean {
    return super.isInSupply(state) && !this.isCaptured(state);
  }
}
