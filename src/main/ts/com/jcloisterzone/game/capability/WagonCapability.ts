import { Queue } from "../../../../io/vavr/SeqTypes.js";
import type { Tuple2 } from "../../../../io/vavr/Tuple.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { Wagon } from "../../figure/Wagon.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

/** Model = queue of scored wagons (and their source) awaiting a move, in play order. */
export type WagonModel = Queue<Tuple2<Wagon, FeaturePointer>>;

/** Wagon (Abbey & Mayor) — when a wagon's feature scores, its owner may move it to
 *  an adjacent open feature instead of returning it. */
export class WagonCapability extends Capability<WagonModel> {
  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    return this.setModel(state, Queue.empty<Tuple2<Wagon, FeaturePointer>>());
  }

  override onTurnPartCleanUp(state: GameState): GameState {
    return this.setModel(state, Queue.empty<Tuple2<Wagon, FeaturePointer>>());
  }
}

Capability.register(WagonCapability);
