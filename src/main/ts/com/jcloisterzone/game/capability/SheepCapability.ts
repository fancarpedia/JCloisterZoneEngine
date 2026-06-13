import { HashMap } from "../../../../io/vavr/Map.js";
import { List, Vector } from "../../../../io/vavr/SeqTypes.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";
import { SheepCapabilityModel } from "./SheepCapabilityModel.js";
import { SheepToken } from "./SheepToken.js";

/** Hills & Sheep — shepherds gather a flock of sheep tokens drawn from a shared bag. */
export class SheepCapability extends Capability<SheepCapabilityModel> {
  // base bag composition (ordinal order matters for deterministic draws)
  private static readonly BASE_COUNTS: ReadonlyArray<[SheepToken, number]> = [
    [SheepToken.SHEEP_1X, 4],
    [SheepToken.SHEEP_2X, 5],
    [SheepToken.SHEEP_3X, 5],
    [SheepToken.SHEEP_4X, 2],
    [SheepToken.WOLF, 2],
  ];

  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    return this.setModel(
      state,
      new SheepCapabilityModel(HashMap.empty(), List.empty()),
    );
  }

  getBagConent(state: GameState): Vector<SheepToken> {
    // start from base counts, subtract already-placed tokens
    const counts = new Map<SheepToken, number>(SheepCapability.BASE_COUNTS);
    for (const tokens of this.getModel(state).getPlacedTokens().values()) {
      for (const token of tokens) {
        counts.set(token, (counts.get(token) ?? 0) - 1);
      }
    }
    // flatten to a bag in ordinal order
    let bag = Vector.empty<SheepToken>();
    for (const token of SheepToken.values()) {
      const n = counts.get(token) ?? 0;
      if (n > 0) bag = bag.appendAll(Vector.fill(n, () => token)) as Vector<SheepToken>;
    }
    return bag;
  }
}

Capability.register(SheepCapability);
