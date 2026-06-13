import { Tuple2 } from "../../../io/vavr/Tuple.js";
import { List, Stream } from "../../../io/vavr/SeqTypes.js";
import { Location } from "../board/Location.js";
import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Meeple } from "../figure/Meeple.js";
import type { GameState } from "../game/state/GameState.js";
import type { Feature } from "./Feature.js";
import { TileFeature } from "./TileFeature.js";

/**
 * A flying machine (The Flier expansion). A Structure with no scoring/meeples of
 * its own. (Ported as a TileFeature with a single place for code reuse.)
 */
export class FlyingMachine extends TileFeature {
  static readonly simpleName = "FlyingMachine";

  private readonly direction: Location;

  constructor(place: FeaturePointer, direction: Location) {
    super(List.of(place));
    this.direction = direction;
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new FlyingMachine(this.getPlace().translate(pos), this.direction.rotateCW(rot));
  }

  override getMeeples2(state: GameState): Stream<Tuple2<Meeple, FeaturePointer>> {
    return Stream.empty<Tuple2<Meeple, FeaturePointer>>();
  }

  override isOccupied(state: GameState): boolean {
    return false;
  }

  getDirection(): Location {
    return this.direction;
  }
}
