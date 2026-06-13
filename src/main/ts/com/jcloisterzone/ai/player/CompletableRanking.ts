import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import type { Map as VMap } from "../../../../io/vavr/Map.js";
import type { Player } from "../../Player.js";
import type { Completable } from "../../feature/Completable.js";
import type { GameState } from "../../game/state/GameState.js";

/** Per-completable-feature scoring snapshot used by {@link LegacyRanking}. */
export class CompletableRanking {
  private readonly feature: Completable;
  private readonly incompletePoints: number;
  private readonly completePoints: number;
  private owners: Set<Player>;
  private readonly ownersPower: number;
  private powers: VMap<Player, number>;
  /** probability to complete the feature */
  private probability = 0;

  constructor(state: GameState, feature: Completable) {
    this.feature = feature;
    this.incompletePoints = feature.getStructurePoints(state, false).getPoints();
    this.completePoints = feature.getStructurePoints(state, true).getPoints();
    this.powers = feature.getPowers(state).mapValues((t) => t._1);

    let maxPower = 0;
    for (const v of this.powers.values()) maxPower = Math.max(maxPower, v);
    this.ownersPower = maxPower;
    // can be 0 for a Mayor on a city without pennant — then no owners
    if (maxPower === 0) {
      this.owners = HashSet.empty<Player>();
    } else {
      this.owners = this.powers.keySet().filter((p) => this.powers.get(p).get() === maxPower);
    }
  }

  getFeature(): Completable {
    return this.feature;
  }
  getCompletePoints(): number {
    return this.completePoints;
  }
  getIncompletePoints(): number {
    return this.incompletePoints;
  }
  getProbability(): number {
    return this.probability;
  }
  setProbability(probability: number): void {
    this.probability = probability;
  }
  getOwners(): Set<Player> {
    return this.owners;
  }
  getOwnersPower(): number {
    return this.ownersPower;
  }
  setOwners(owners: Set<Player>): void {
    this.owners = owners;
  }
  getPowers(): VMap<Player, number> {
    return this.powers;
  }
  setPowers(powers: VMap<Player, number>): void {
    this.powers = powers;
  }
}
