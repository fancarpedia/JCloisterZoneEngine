import { HashSet, type Set } from "../../../io/vavr/Set.js";
import { List } from "../../../io/vavr/SeqTypes.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { ExprItem } from "../event/ExprItem.js";
import { PointsExpression } from "../event/PointsExpression.js";
import type { WagonEligible } from "../game/capability/trait/WagonEligible.js";
import type { GameState } from "../game/state/GameState.js";
import type { Completable } from "./Completable.js";
import type { Feature } from "./Feature.js";
import { MonasticFeature } from "./MonasticFeature.js";

/**
 * Baba Yaga's hut (Russian Promos). A separate feature type (not a Monastery) so it is
 * excluded from Cult shrine/monastery challenges. Completed when surrounded by 8 tiles;
 * scores 9 minus 1 per adjacent (and diagonal) tile.
 */
export class YagaHut extends MonasticFeature implements WagonEligible {
  isWagonEligible(): true {
    return true;
  }

  static readonly simpleName = "YagaHut";

  private static readonly INITIAL_PLACE = List.of(
    new FeaturePointer(Position.ZERO, YagaHut, Location.I),
  );

  constructor(
    places: List<FeaturePointer> = YagaHut.INITIAL_PLACE,
    neighboring: Set<FeaturePointer> = HashSet.empty<FeaturePointer>(),
  ) {
    super(places, neighboring);
  }

  override setNeighboring(neighboring: Set<FeaturePointer>): Completable {
    if (this.neighboring === neighboring) return this as unknown as Completable;
    return new YagaHut(this.getPlaces(), neighboring) as unknown as Completable;
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new YagaHut(this.placeOnBoardPlaces(pos, rot), this.placeOnBoardNeighboring(pos, rot));
  }

  getStructurePoints(state: GameState, _completed: boolean): PointsExpression {
    const p = this.getPlaces().head().getPosition();
    const adjacent = state.getAdjacentAndDiagonalTiles2(p).size();
    return new PointsExpression(
      "yaga-hut",
      List.of(new ExprItem("yaga", 9), new ExprItem(adjacent, "tiles", -adjacent)),
    );
  }
}
