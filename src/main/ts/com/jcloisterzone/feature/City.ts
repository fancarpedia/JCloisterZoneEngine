import { Tuple2 } from "../../../io/vavr/Tuple.js";
import { HashSet, type Set } from "../../../io/vavr/Set.js";
import { type Map as VMap } from "../../../io/vavr/Map.js";
import { List } from "../../../io/vavr/SeqTypes.js";
import { Edge } from "../board/Edge.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { ShortEdge } from "../board/ShortEdge.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { ExprItem } from "../event/ExprItem.js";
import { PointsExpression } from "../event/PointsExpression.js";
import { Rule } from "../game/Rule.js";
import { GameElementQuery } from "../game/setup/GameElementQuery.js";
import type { BuilderExtendable } from "../game/capability/trait/BuilderExtendable.js";
import type { FlowersBonusAffected } from "../game/capability/trait/FlowersBonusAffected.js";
import type { WagonEligible } from "../game/capability/trait/WagonEligible.js";
import type { GameState } from "../game/state/GameState.js";
import { CompletableFeature } from "./CompletableFeature.js";
import type { Feature } from "./Feature.js";
import { GamblersLuckShield } from "./GamblersLuckShield.js";
import type { ModifiedFeature } from "./ModifiedFeature.js";
import { BooleanAnyModifier } from "./modifier/BooleanAnyModifier.js";
import type { BooleanModifier } from "./modifier/BooleanModifier.js";
import type { FeatureModifier } from "./modifier/FeatureModifier.js";
import { FeaturePointerAddModifier } from "./modifier/FeaturePointerAddModifier.js";
import { IntegerAddModifier } from "./modifier/IntegerAddModifier.js";
import { IntegerNonMergingModifier } from "./modifier/IntegerNonMergingModifier.js";
import * as ModifierSupport from "./modifier/ModifierSupport.js";

type ModMap = VMap<FeatureModifier<unknown>, unknown>;

/** A city feature. */
export class City
  extends CompletableFeature<City>
  implements BuilderExtendable, FlowersBonusAffected, WagonEligible, ModifiedFeature
{
  static readonly simpleName = "City";
  isWagonEligible(): true {
    return true;
  }
  isBuilderExtendable(): true {
    return true;
  }
  isFlowersBonusAffected(): true {
    return true;
  }

  static readonly PENNANTS = new IntegerAddModifier("city[pennants]", null);
  static readonly DARMSTADTIUM = new BooleanAnyModifier("city[darmstadtium]", null);
  static readonly BESIEGED = new BooleanAnyModifier("city[besieged]", new GameElementQuery("siege"));
  static readonly CATHEDRAL = new BooleanAnyModifier("city[cathedral]", new GameElementQuery("cathedral"));
  static readonly PRINCESS = new BooleanAnyModifier("city[princess]", new GameElementQuery("princess"));
  static readonly POINTS_MODIFIER = new IntegerNonMergingModifier("city[points]", null);
  static readonly GAMBLERS_LUCK_SHIELDS = new FeaturePointerAddModifier<GamblersLuckShield>(
    "city[gamblers-luck-shield]",
    null,
    GamblersLuckShield,
  );
  static readonly ELIMINATED_PENNANTS = new BooleanAnyModifier("city[eliminated-pennants]", null);

  /** HS.CC!.v abstraction: multiple cities can connect to the same edge. */
  private readonly multiEdges: Set<Tuple2<ShortEdge, FeaturePointer>>;
  private readonly modifiers: ModMap;

  constructor(places: List<FeaturePointer>, openEdges: Set<Edge>, modifiers: ModMap);
  constructor(
    places: List<FeaturePointer>,
    openEdges: Set<Edge>,
    neighboring: Set<FeaturePointer>,
    multiEdges: Set<Tuple2<ShortEdge, FeaturePointer>>,
    modifiers: ModMap,
  );
  constructor(
    places: List<FeaturePointer>,
    openEdges: Set<Edge>,
    arg3: ModMap | Set<FeaturePointer>,
    multiEdges?: Set<Tuple2<ShortEdge, FeaturePointer>>,
    modifiers?: ModMap,
  ) {
    if (multiEdges === undefined) {
      // (places, openEdges, modifiers)
      super(places, openEdges, HashSet.empty<FeaturePointer>());
      this.multiEdges = HashSet.empty<Tuple2<ShortEdge, FeaturePointer>>();
      this.modifiers = arg3 as ModMap;
    } else {
      super(places, openEdges, arg3 as Set<FeaturePointer>);
      this.multiEdges = multiEdges;
      this.modifiers = modifiers!;
    }
  }

  // --- ModifiedFeature ---
  getModifiers(): ModMap {
    return this.modifiers;
  }

  setModifiers(modifiers: ModMap): City {
    if (this.modifiers === modifiers) return this;
    return new City(this.places, this.openEdges, this.neighboring, this.multiEdges, modifiers);
  }

  putModifier<T>(modifier: FeatureModifier<T>, value: T): City {
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

  // --- merge / edges ---
  merge(city: City): City {
    return new City(
      this.mergePlaces(city),
      this.mergeEdges(city),
      this.mergeNeighboring(city),
      this.mergeMultiEdges(city),
      this.mergeModifiers(city.getModifiers()),
    );
  }

  closeEdge(edge: Edge): City {
    return new City(
      this.places,
      this.openEdges.remove(edge),
      this.neighboring,
      this.multiEdges.filter((me) => !me._1.equals(edge)),
      this.modifiers,
    );
  }

  setOpenEdges(openEdges: Set<Edge>): City {
    return new City(this.places, openEdges, this.neighboring, this.multiEdges, this.modifiers);
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new City(
      this.placeOnBoardPlaces(pos, rot),
      this.placeOnBoardEdges(pos, rot),
      this.placeOnBoardNeighboring(pos, rot),
      this.placeOnBoardMultiEdges(pos, rot),
      this.modifiers,
    );
  }

  setMultiEdges(multiEdges: Set<Tuple2<ShortEdge, FeaturePointer>>): City {
    if (this.multiEdges === multiEdges) return this;
    return new City(this.places, this.openEdges, this.neighboring, multiEdges, this.modifiers);
  }

  getMultiEdges(): Set<Tuple2<ShortEdge, FeaturePointer>> {
    return this.multiEdges;
  }

  override setNeighboring(neighboring: Set<FeaturePointer>): City {
    if (this.neighboring === neighboring) return this;
    return new City(this.places, this.openEdges, neighboring, this.multiEdges, this.modifiers);
  }

  // --- scoring ---
  getStructurePoints(state: GameState, completed: boolean): PointsExpression {
    const points = ModifierSupport.getModifier<number | null>(
      this.modifiers,
      state,
      City.POINTS_MODIFIER as unknown as FeatureModifier<number | null>,
      null,
    );
    let tinyCity = false;
    const exprItems: ExprItem[] = [];

    if (points !== null) {
      exprItems.push(new ExprItem(1, "tiles", points));
    } else {
      const cathedral = this.hasModifier(state, City.CATHEDRAL);

      if (
        cathedral &&
        !completed &&
        state.getStringRule(Rule.INN_AND_CATHEDRAL_FINAL_SCORING) !== "ignore"
      ) {
        return new PointsExpression("city.incomplete", new ExprItem("cathedral", 0));
      }

      const besieged = this.hasModifier(state, City.BESIEGED);
      let pennants = this.getModifier(state, City.PENNANTS, 0);
      if (this.hasModifier(state, City.ELIMINATED_PENNANTS)) {
        pennants = 0;
      }
      const tileCount = this.getTilePositions().size();

      tinyCity = completed && tileCount === 2 && state.getStringRule(Rule.TINY_CITY_SCORING) === "2";

      exprItems.push(new ExprItem(tileCount, "tiles", tileCount * (completed && !tinyCity ? 2 : 1)));
      if (pennants > 0) {
        exprItems.push(
          new ExprItem(pennants, "pennants", completed && !tinyCity ? 2 * pennants : pennants),
        );
      }
      if (besieged) {
        exprItems.push(new ExprItem("besieged", -tileCount - pennants));
      }
      if (cathedral && completed) {
        exprItems.push(new ExprItem("cathedral", tileCount + pennants));
      }
      if (completed && this.hasModifier(state, City.DARMSTADTIUM)) {
        exprItems.push(new ExprItem("darmstadtium", 3));
      }

      // NOTE: scoreScriptedModifiers(...) intentionally omitted (GraalVM dropped).
    }

    let name = "city";
    if (tinyCity) {
      name = "city.tiny";
    } else if (!completed) {
      name = "city.incomplete";
    }
    return new PointsExpression(name, List.ofAll(exprItems));
  }

  getPoints(state: GameState): PointsExpression {
    const basePoints = this.getStructurePoints(state, this.isCompleted(state));
    return this.getMageAndWitchPoints(state, basePoints).appendAll(
      this.getLittleBuildingPoints(state),
    );
  }

  protected mergeMultiEdges(city: City): Set<Tuple2<ShortEdge, FeaturePointer>> {
    return this.multiEdges.addAll(city.multiEdges);
  }

  protected placeOnBoardMultiEdges(
    pos: Position,
    rot: Rotation,
  ): Set<Tuple2<ShortEdge, FeaturePointer>> {
    return this.multiEdges.map((t) => {
      const edge = t._1.rotateCW(Position.ZERO, rot).translate(pos);
      const fp = t._2.rotateCW(rot).translate(pos);
      return new Tuple2(edge, fp);
    });
  }
}
