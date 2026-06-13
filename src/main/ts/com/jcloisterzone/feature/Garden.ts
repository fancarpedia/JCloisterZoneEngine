import { Tuple2 } from "../../../io/vavr/Tuple.js";
import { HashSet, type Set } from "../../../io/vavr/Set.js";
import { List, Stream } from "../../../io/vavr/SeqTypes.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { ExprItem } from "../event/ExprItem.js";
import { PointsExpression } from "../event/PointsExpression.js";
import { Rule } from "../game/Rule.js";
import { VineyardCapability } from "../game/capability/VineyardCapability.js";
import type { GameState } from "../game/state/GameState.js";
import type { PlacedTile } from "../game/state/PlacedTile.js";
import type { Feature } from "./Feature.js";
import { MonasticFeature } from "./MonasticFeature.js";
import type { NeighbouringFeature } from "./NeighbouringFeature.js";

/** A garden (monastic feature, German monasteries / gardens). */
export class Garden extends MonasticFeature {
  static readonly simpleName = "Garden";

  private static readonly INITIAL_PLACE = List.of(
    new FeaturePointer(Position.ZERO, Garden, Location.I),
  );

  constructor(places?: List<FeaturePointer>, neighboring?: Set<FeaturePointer>) {
    super(places ?? Garden.INITIAL_PLACE, neighboring ?? HashSet.empty<FeaturePointer>());
  }

  override setNeighboring(neighboring: Set<FeaturePointer>): Garden {
    if (this.neighboring === neighboring) return this;
    return new Garden(this.places, neighboring);
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new Garden(this.placeOnBoardPlaces(pos, rot), this.placeOnBoardNeighboring(pos, rot));
  }

  getStructurePoints(state: GameState, completed: boolean): PointsExpression {
    const scoreVineyards =
      state.hasCapability(VineyardCapability) && state.getBooleanRule(Rule.VINEYARDS_FOR_GARDEN);
    let adjacent = 0;
    let adjacentVineyards = 0;
    for (const t of state.getAdjacentAndDiagonalTiles2(this.getPosition())) {
      adjacent++;
      if (scoreVineyards && t._2.getTile().hasModifier(VineyardCapability.VINEYARD)) {
        adjacentVineyards++;
      }
    }
    const exprItems: ExprItem[] = [];
    exprItems.push(new ExprItem(adjacent + 1, "tiles", adjacent + 1));
    if (completed && adjacentVineyards > 0) {
      exprItems.push(new ExprItem(adjacentVineyards, "vineyards", adjacentVineyards * 3));
    }
    return new PointsExpression(completed ? "garden" : "garden.incomplete", List.ofAll(exprItems));
  }

  override getRangeTiles(state: GameState): Stream<PlacedTile> {
    return state
      .getAdjacentAndDiagonalTiles2(this.getPlace().getPosition())
      .map((t) => t._2)
      .append(state.getPlacedTile(this.getPlace().getPosition())!) as Stream<PlacedTile>;
  }
}
