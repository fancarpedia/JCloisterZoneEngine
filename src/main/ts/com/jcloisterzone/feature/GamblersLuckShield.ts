import { List } from "../../../io/vavr/SeqTypes.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { GamblersLuckCapability } from "../game/capability/GamblersLuckCapability.js";
import { TileFeature } from "./TileFeature.js";

type GamblersLuckShieldToken = GamblersLuckCapability.GamblersLuckShieldToken;

/** A gamblers-luck shield token feature (Gamblers' Luck promo). */
export class GamblersLuckShield extends TileFeature {
  static readonly simpleName = "GamblersLuckShield";

  private readonly shieldToken: GamblersLuckShieldToken | null;

  constructor(loc: Location);
  constructor(places: List<FeaturePointer>, shieldToken: GamblersLuckShieldToken | null);
  constructor(a: Location | List<FeaturePointer>, shieldToken?: GamblersLuckShieldToken | null) {
    if (a instanceof List) {
      super(a);
      this.shieldToken = shieldToken ?? null;
    } else {
      super(List.of(new FeaturePointer(Position.ZERO, GamblersLuckShield, a)));
      this.shieldToken = null;
    }
  }

  placeOnBoard(pos: Position, rot: Rotation): GamblersLuckShield {
    return new GamblersLuckShield(this.placeOnBoardPlaces(pos, rot), this.shieldToken);
  }

  setShieldToken(shieldToken: GamblersLuckShieldToken | null): GamblersLuckShield {
    return new GamblersLuckShield(this.places, shieldToken);
  }

  getShieldToken(): GamblersLuckShieldToken | null {
    return this.shieldToken;
  }
}
