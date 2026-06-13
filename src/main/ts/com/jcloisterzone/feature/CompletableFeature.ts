import { type Set } from "../../../io/vavr/Set.js";
import { List } from "../../../io/vavr/SeqTypes.js";
import { Edge } from "../board/Edge.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { ExprItem } from "../event/ExprItem.js";
import { PointsExpression } from "../event/PointsExpression.js";
import type { GameState } from "../game/state/GameState.js";
import type { Completable } from "./Completable.js";
import type { EdgeFeature } from "./EdgeFeature.js";
import type { MultiTileFeature } from "./MultiTileFeature.js";
import { NeighbouringTileFeature } from "./NeighbouringTileFeature.js";

/** Base for completable multi-tile features (City, Road). */
export abstract class CompletableFeature<T extends CompletableFeature<any>>
  extends NeighbouringTileFeature
  implements Completable, MultiTileFeature
{
  isCompletable(): true {
    return true;
  }

  protected readonly openEdges: Set<Edge>;

  constructor(places: List<FeaturePointer>, openEdges: Set<Edge>, neighboring: Set<FeaturePointer>) {
    super(places, neighboring);
    this.openEdges = openEdges;
  }

  abstract setOpenEdges(openEdges: Set<Edge>): T;
  abstract override setNeighboring(neighboring: Set<FeaturePointer>): T;
  abstract closeEdge(edge: Edge): T;
  abstract merge(f: T): T;
  abstract getPoints(state: GameState): PointsExpression;
  abstract getStructurePoints(state: GameState, completed: boolean): PointsExpression;

  isOpen(state: GameState): boolean {
    return !this.openEdges.isEmpty();
  }

  isCompleted(state: GameState): boolean {
    return !this.isOpen(state);
  }

  getOpenEdges(): Set<Edge> {
    return this.openEdges;
  }

  // (isMergeableWith / getProxyTarget inherited from TileFeature)

  // helpers
  protected getMageAndWitchPoints(state: GameState, expr: PointsExpression): PointsExpression {
    const mage = state.getNeutralFigures().getMage();
    const witch = state.getNeutralFigures().getWitch();
    if (mage !== null && mage.getFeature(state) === (this as unknown)) {
      const tileCount = this.getTilePositions().size();
      expr = expr.append(new ExprItem("mage", tileCount));
    }
    if (witch !== null && witch.getFeature(state) === (this as unknown)) {
      const points = expr.getPoints();
      expr = expr.append(new ExprItem("witch", Math.trunc(-points / 2)));
    }
    return expr;
  }

  protected mergeEdges(obj: T): Set<Edge> {
    const connectedEdges = this.openEdges.intersect(obj.openEdges);
    return this.openEdges.union(obj.openEdges).diff(connectedEdges);
  }

  protected mergeNeighboring(obj: T): Set<FeaturePointer> {
    return this.neighboring.addAll(obj.neighboring);
  }

  protected placeOnBoardEdges(pos: Position, rot: Rotation): Set<Edge> {
    return this.openEdges.map((edge) => edge.rotateCW(Position.ZERO, rot).translate(pos));
  }
}
