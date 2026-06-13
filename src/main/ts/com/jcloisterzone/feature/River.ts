import { type Map as VMap } from "../../../io/vavr/Map.js";
import { HashSet, type Set } from "../../../io/vavr/Set.js";
import { List } from "../../../io/vavr/SeqTypes.js";
import { Edge } from "../board/Edge.js";
import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { ExprItem } from "../event/ExprItem.js";
import { PointsExpression } from "../event/PointsExpression.js";
import type { FlowersBonusAffected } from "../game/capability/trait/FlowersBonusAffected.js";
import type { GameState } from "../game/state/GameState.js";
import { CompletableFeature } from "./CompletableFeature.js";
import type { ModifiedFeature } from "./ModifiedFeature.js";
import type { BooleanModifier } from "./modifier/BooleanModifier.js";
import type { FeatureModifier } from "./modifier/FeatureModifier.js";
import * as ModifierSupport from "./modifier/ModifierSupport.js";

type ModMap = VMap<FeatureModifier<unknown>, unknown>;

/** A river feature. */
export class River extends CompletableFeature<River> implements FlowersBonusAffected, ModifiedFeature {
  isFlowersBonusAffected(): true {
    return true;
  }

  static readonly simpleName = "River";

  private readonly modifiers: ModMap;

  constructor(places: List<FeaturePointer>, openEdges: Set<Edge>, modifiers: ModMap);
  constructor(
    places: List<FeaturePointer>,
    openEdges: Set<Edge>,
    neighboring: Set<FeaturePointer>,
    modifiers: ModMap,
  );
  constructor(
    places: List<FeaturePointer>,
    openEdges: Set<Edge>,
    arg3: ModMap | Set<FeaturePointer>,
    modifiers?: ModMap,
  ) {
    if (modifiers === undefined) {
      super(places, openEdges, HashSet.empty<FeaturePointer>());
      this.modifiers = arg3 as ModMap;
    } else {
      super(places, openEdges, arg3 as Set<FeaturePointer>);
      this.modifiers = modifiers;
    }
  }

  getModifiers(): ModMap {
    return this.modifiers;
  }
  setModifiers(modifiers: ModMap): River {
    if (this.modifiers === modifiers) return this;
    return new River(this.places, this.openEdges, this.neighboring, modifiers);
  }
  putModifier<T>(modifier: FeatureModifier<T>, value: T): River {
    return this.setModifiers(this.modifiers.put(modifier as FeatureModifier<unknown>, value));
  }
  hasModifier(state: GameState, modifier: BooleanModifier): boolean {
    return ModifierSupport.hasModifier(this.modifiers, state, modifier);
  }
  getModifier<T>(state: GameState, modifier: FeatureModifier<T>, defaultValue: T): T {
    return ModifierSupport.getModifier(this.modifiers, state, modifier, defaultValue);
  }
  getScriptedModifiers(state: GameState): Set<FeatureModifier<unknown>> {
    return ModifierSupport.getScriptedModifiers(this.modifiers, state);
  }
  mergeModifiers(otherModifiers: ModMap): ModMap {
    return ModifierSupport.mergeModifierMaps(this.modifiers, otherModifiers);
  }

  setOpenEdges(openEdges: Set<Edge>): River {
    return new River(this.places, openEdges, this.neighboring, this.modifiers);
  }

  placeOnBoard(pos: Position, rot: Rotation): River {
    return new River(
      this.placeOnBoardPlaces(pos, rot),
      this.placeOnBoardEdges(pos, rot),
      this.placeOnBoardNeighboring(pos, rot),
      this.modifiers,
    );
  }

  override setNeighboring(neighboring: Set<FeaturePointer>): River {
    if (this.neighboring === neighboring) return this;
    return new River(this.places, this.openEdges, neighboring, this.modifiers);
  }

  merge(river: River): River {
    return new River(
      this.mergePlaces(river),
      this.mergeEdges(river),
      this.mergeNeighboring(river),
      this.mergeModifiers(river.getModifiers()),
    );
  }

  closeEdge(edge: Edge): River {
    return new River(this.places, this.openEdges.remove(edge), this.neighboring, this.modifiers);
  }

  getStructurePoints(state: GameState, completed: boolean): PointsExpression {
    const tileCount = this.getTilePositions().size();
    const exprItems: ExprItem[] = [];
    exprItems.push(new ExprItem(tileCount, "tiles", (completed ? 2 : 1) * tileCount));
    // NOTE: scoreScriptedModifiers(...) intentionally omitted (GraalVM dropped).
    return new PointsExpression(completed ? "river" : "river.incomplete", List.ofAll(exprItems));
  }

  getPoints(state: GameState): PointsExpression {
    const basePoints = this.getStructurePoints(state, this.isCompleted(state));
    return this.getMageAndWitchPoints(state, basePoints).appendAll(this.getLittleBuildingPoints(state));
  }
}
