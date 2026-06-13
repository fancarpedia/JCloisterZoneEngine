import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import type { Stream } from "../../../../io/vavr/SeqTypes.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import { JavaEnum } from "../../../../lang/JavaEnum.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { GamblersLuckShield } from "../../feature/GamblersLuckShield.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { Capability } from "../Capability.js";
import type { Token } from "../Token.js";
import type { GameState } from "../state/GameState.js";
import type { PlacedTile } from "../state/PlacedTile.js";

type Model = VMap<FeaturePointer, Tuple2<GamblersLuckCapability.GamblersLuckShieldToken, number>>;

/** Gamblers' Luck promo. Model: placed shield tokens by feature pointer. */
export class GamblersLuckCapability extends Capability<Model> {
  override onStartGame(state: GameState, random: RandomGenerator): GameState {
    return this.setModel(state, HashMap.empty());
  }

  getPlacedTileGamblersLuckShields(
    state: GameState,
  ): Stream<Tuple2<FeaturePointer, GamblersLuckShield>> {
    return this.getGamblersLuckShieldsOnPlacedTile(state, state.getLastPlaced()!);
  }

  getGamblersLuckShieldsOnPlacedTile(
    state: GameState,
    pt: PlacedTile,
  ): Stream<Tuple2<FeaturePointer, GamblersLuckShield>> {
    return state.getTileFeatures2(pt.getPosition(), GamblersLuckShield);
  }

  hasPlacedTileGamblersLuckShields(state: GameState): boolean {
    return this.getPlacedTileGamblersLuckShields(state).length() !== 0;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GamblersLuckCapability {
  export class GamblersLuckShieldToken extends JavaEnum implements Token {
    static readonly GAMBLERSLUCKSHIELD_0 = new GamblersLuckShieldToken("GAMBLERSLUCKSHIELD_0", 0);
    static readonly GAMBLERSLUCKSHIELD_1 = new GamblersLuckShieldToken("GAMBLERSLUCKSHIELD_1", 1);
    static readonly GAMBLERSLUCKSHIELD_2 = new GamblersLuckShieldToken("GAMBLERSLUCKSHIELD_2", 2);
    static readonly GAMBLERSLUCKSHIELD_3 = new GamblersLuckShieldToken("GAMBLERSLUCKSHIELD_3", 3);
    static readonly GAMBLERSLUCKSHIELD_X = new GamblersLuckShieldToken("GAMBLERSLUCKSHIELD_X", 4);
    private static readonly VALUES: readonly GamblersLuckShieldToken[] = [
      GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_0,
      GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_1,
      GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_2,
      GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_3,
      GamblersLuckShieldToken.GAMBLERSLUCKSHIELD_X,
    ];
    static values(): readonly GamblersLuckShieldToken[] {
      return GamblersLuckShieldToken.VALUES;
    }
  }
}

Capability.register(GamblersLuckCapability);
