import { HashSet, type Set } from "../../../io/vavr/Set.js";
import { List, Stream } from "../../../io/vavr/SeqTypes.js";
import { type Map as VMap } from "../../../io/vavr/Map.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { ExprItem } from "../event/ExprItem.js";
import { PointsExpression } from "../event/PointsExpression.js";
import type { ClassToken } from "../../../lang/Class.js";
import type { Capability } from "../game/Capability.js";
import { FishHutsCapability } from "../game/capability/FishHutsCapability.js";
import { LittleBuildingsCapability } from "../game/capability/LittleBuildingsCapability.js";
import type { WagonEligible } from "../game/capability/trait/WagonEligible.js";
import type { GameState } from "../game/state/GameState.js";
import type { PlacedTile } from "../game/state/PlacedTile.js";
import type { Completable } from "./Completable.js";
import type { Feature } from "./Feature.js";
import { MonasticFeature } from "./MonasticFeature.js";
import { River } from "./River.js";

/**
 * Fish hut (Fish Huts fan expansion). A monastic-style feature completed by its four
 * DIAGONAL tiles only: scores 7 when completed, plus 2 per diagonal river tile
 * (0 when incomplete). Deployable only with FishHutsCapability.
 */
export class FishHut extends MonasticFeature implements WagonEligible {
  isWagonEligible(): true {
    return true;
  }

  static readonly simpleName = "FishHut";

  constructor(loc: Location);
  constructor(places: List<FeaturePointer>, neighboring: Set<FeaturePointer>);
  constructor(a: Location | List<FeaturePointer>, neighboring?: Set<FeaturePointer>) {
    if (a instanceof Location) {
      super(List.of(new FeaturePointer(Position.ZERO, FishHut, a)), HashSet.empty<FeaturePointer>());
    } else {
      super(a, neighboring ?? HashSet.empty<FeaturePointer>());
    }
  }

  override setNeighboring(neighboring: Set<FeaturePointer>): Completable {
    if (this.neighboring === neighboring) return this as unknown as Completable;
    return new FishHut(this.getPlaces(), neighboring) as unknown as Completable;
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new FishHut(this.placeOnBoardPlaces(pos, rot), this.placeOnBoardNeighboring(pos, rot));
  }

  override isOpen(state: GameState): boolean {
    return state.getDiagonalTiles2(this.getPosition()).size() < 4;
  }

  override getRequiredCapability(): ClassToken<Capability<unknown>> {
    return FishHutsCapability as unknown as ClassToken<Capability<unknown>>;
  }

  getStructurePoints(state: GameState, completed: boolean): PointsExpression {
    let items = List.of(new ExprItem("fishhut", completed ? 7 : 0));
    if (completed) {
      const pos = this.getPlaces().head().getPosition();
      const riverTiles = state
        .getDiagonalTiles(pos)
        .filter((pt) =>
          state
            .getFeatureMap()
            .get(pt.getPosition())
            .get()
            .keySet()
            .find((fp) => fp.getFeature() === (River as never))
            .isDefined(),
        )
        .length();
      if (riverTiles > 0) {
        items = items.append(new ExprItem(riverTiles, "river-tiles", riverTiles * 2)) as List<ExprItem>;
      }
    }
    return new PointsExpression("fishhut", items);
  }

  override getRangeTiles(state: GameState): Stream<PlacedTile> {
    return state.getDiagonalTiles2(this.getPosition()).map((t) => t._2) as Stream<PlacedTile>;
  }

  /** Java Monastic default filters little buildings by getRangeTiles — for a fish hut
   *  that is the DIAGONAL tiles only (the TS MonasticFeature base uses a 3×3 box). */
  override getLittleBuildingPoints(state: GameState): List<ExprItem> {
    const buildings = state.getCapabilityModel<
      VMap<Position, LittleBuildingsCapability.LittleBuilding>
    >(LittleBuildingsCapability);
    if (buildings === null) {
      return List.empty<ExprItem>();
    }
    let tilePositions: Set<Position> = HashSet.empty<Position>();
    for (const pt of this.getRangeTiles(state)) tilePositions = tilePositions.add(pt.getPosition());
    const buildingsSeq = buildings.filterKeys((pos) => tilePositions.contains(pos)).values();
    return LittleBuildingsCapability.getBuildingsPoints(state, buildingsSeq);
  }
}
