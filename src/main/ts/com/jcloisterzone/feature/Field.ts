import { type Map as VMap } from "../../../io/vavr/Map.js";
import { type Set } from "../../../io/vavr/Set.js";
import { List } from "../../../io/vavr/SeqTypes.js";
import { type ClassToken } from "../../../lang/Class.js";
import type { Player } from "../Player.js";
import type { Edge } from "../board/Edge.js";
import { Location } from "../board/Location.js";
import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer, __setIsFieldClass } from "../board/pointer/FeaturePointer.js";
import { ExprItem } from "../event/ExprItem.js";
import { PointsExpression } from "../event/PointsExpression.js";
import { Pig } from "../figure/Pig.js";
import type { Capability } from "../game/Capability.js";
import { FieldCapability } from "../game/capability/FieldCapability.js";
import { GameElementQuery } from "../game/setup/GameElementQuery.js";
import type { GameState } from "../game/state/GameState.js";
import { Castle } from "./Castle.js";
import { City } from "./City.js";
import type { Feature } from "./Feature.js";
import type { ModifiedFeature } from "./ModifiedFeature.js";
import type { MultiTileFeature } from "./MultiTileFeature.js";
import { ScoreableTileFeature } from "./ScoreableTileFeature.js";
import { IntegerAddModifier } from "./modifier/IntegerAddModifier.js";
import { MultisetStringIntegerAddModifier } from "./modifier/MultisetStringIntegerAddModifier.js";
import type { BooleanModifier } from "./modifier/BooleanModifier.js";
import type { FeatureModifier } from "./modifier/FeatureModifier.js";
import * as ModifierSupport from "./modifier/ModifierSupport.js";

type ModMap = VMap<FeatureModifier<unknown>, unknown>;

/** A field feature (scores adjoining completed cities). */
export class Field extends ScoreableTileFeature implements MultiTileFeature, ModifiedFeature {
  static readonly simpleName = "Field";

  static readonly PIG_HERD = new IntegerAddModifier("field[pig-herd]", new GameElementQuery("pig-herd"));
  static readonly FLOWERS = new MultisetStringIntegerAddModifier(
    "field[flowers]",
    new GameElementQuery("flowers"),
  );

  protected readonly adjoiningCities: Set<FeaturePointer>;
  protected readonly adjoiningCityOfCarcassonne: boolean;
  private readonly modifiers: ModMap;

  constructor(
    places: List<FeaturePointer>,
    adjoiningCities: Set<FeaturePointer>,
    adjoiningCityOfCarcassonne: boolean,
    modifiers: ModMap,
  ) {
    super(places);
    this.adjoiningCities = adjoiningCities;
    this.adjoiningCityOfCarcassonne = adjoiningCityOfCarcassonne;
    this.modifiers = modifiers;
  }

  // --- ModifiedFeature ---
  getModifiers(): ModMap {
    return this.modifiers;
  }

  setModifiers(modifiers: ModMap): Field {
    if (this.modifiers === modifiers) return this;
    return new Field(this.places, this.adjoiningCities, this.adjoiningCityOfCarcassonne, modifiers);
  }

  putModifier<T>(modifier: FeatureModifier<T>, value: T): Field {
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

  override getRequiredCapability(): ClassToken<Capability<unknown>> {
    return FieldCapability as unknown as ClassToken<Capability<unknown>>;
  }

  // --- MultiTileFeature ---
  merge(field: Field): Field {
    return new Field(
      this.mergePlaces(field),
      this.mergeAdjoiningCities(field),
      this.adjoiningCityOfCarcassonne || field.adjoiningCityOfCarcassonne,
      this.mergeModifiers(field.getModifiers()),
    );
  }

  closeEdge(edge: Edge): Field {
    return this;
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new Field(
      this.placeOnBoardPlaces(pos, rot),
      this.placeOnBoardAdjoiningCities(pos, rot),
      this.adjoiningCityOfCarcassonne,
      this.modifiers,
    );
  }

  isOpen(state: GameState): boolean {
    const places = this.getPlaces();
    if (places.length() === 1) {
      const loc = places.head().getLocation()!;
      if (loc.isInner()) {
        return false;
      }
      // otherwise it can still be closed when placed next to an Abbey
    }
    for (const fp of places) {
      const pos = fp.getPosition();
      for (const loc of fp
        .getLocation()!
        .splitToFieldSides()
        .map((l) => l.fieldToSide())
        .distinct()) {
        if (!state.getPlacedTiles().containsKey(pos.add(loc))) {
          return true;
        }
      }
    }
    return false;
  }

  getAdjoiningCities(): Set<FeaturePointer> {
    return this.adjoiningCities;
  }

  setAdjoiningCities(adjoiningCities: Set<FeaturePointer>): Field {
    return new Field(this.places, adjoiningCities, this.adjoiningCityOfCarcassonne, this.modifiers);
  }

  isAdjoiningCityOfCarcassonne(): boolean {
    return this.adjoiningCityOfCarcassonne;
  }

  setAdjoiningCityOfCarcassonne(adjoiningCityOfCarcassonne: boolean): Field {
    return new Field(this.places, this.adjoiningCities, adjoiningCityOfCarcassonne, this.modifiers);
  }

  private getPigCount(state: GameState, player: Player): number {
    return this.getSpecialMeeples(state).count(
      (m) => m instanceof Pig && m.getPlayer().equals(player),
    );
  }

  getPoints(state: GameState, exprSubtitle: string | null, player: Player): PointsExpression {
    return this.getCityPoints(
      state,
      exprSubtitle === null ? "field" : "field." + exprSubtitle,
      3,
      player,
    ).appendAll(this.getLittleBuildingPoints(state));
  }

  getPointsWhenBarnIsConnected(state: GameState, player: Player): PointsExpression {
    return this.getCityPoints(state, "field.barn-connected", 1, player).appendAll(
      this.getLittleBuildingPoints(state),
    );
  }

  getBarnPoints(state: GameState): PointsExpression {
    // no pig herds according to Complete Annotated Rules
    return this.getCityPoints(state, "field", 4, null).appendAll(this.getLittleBuildingPoints(state));
  }

  private getCityPoints(
    state: GameState,
    exprName: string,
    pointsPerCity: number,
    scorePigsForPlayer: Player | null,
  ): PointsExpression {
    let castleCount = 0;
    let cityCount = 0;
    let besiegedCount = 0;

    // can't use getFeature because pointer can reference a city now converted to a castle
    const features = this.adjoiningCities.map((fp) =>
      state.getFeaturePartOf(fp.getPosition(), fp.getLocation()!),
    );
    for (const feature of features) {
      if (feature instanceof Castle) {
        castleCount++;
      } else if (feature instanceof City) {
        if (feature.isCompleted(state)) {
          cityCount++;
          if (feature.hasModifier(state, City.BESIEGED)) {
            besiegedCount++;
          }
        }
      }
    }

    const exprItems: ExprItem[] = [];
    if (cityCount > 0) {
      exprItems.push(new ExprItem(cityCount, "cities", cityCount * pointsPerCity));
    }
    if (besiegedCount > 0) {
      exprItems.push(new ExprItem(besiegedCount, "besieged", besiegedCount * pointsPerCity));
    }
    if (castleCount > 0) {
      exprItems.push(new ExprItem(castleCount, "castles", castleCount * (pointsPerCity + 1)));
    }
    if (this.adjoiningCityOfCarcassonne) {
      exprItems.push(new ExprItem("coc", pointsPerCity));
    }

    const scoredObjects = cityCount + castleCount + (this.adjoiningCityOfCarcassonne ? 1 : 0);
    if (scorePigsForPlayer !== null && scoredObjects > 0) {
      const pigCount = this.getPigCount(state, scorePigsForPlayer);
      const pigHerds = this.getModifier(state, Field.PIG_HERD, 0);
      if (pigCount > 0) {
        exprItems.push(new ExprItem("pigs", scoredObjects)); // do not stack
      }
      if (pigHerds > 0) {
        exprItems.push(new ExprItem("pigHerds", scoredObjects)); // do not stack
      }
    }

    // NOTE: scoreScriptedModifiers(...) intentionally omitted (GraalVM dropped).
    return new PointsExpression(exprName, List.ofAll(exprItems));
  }

  protected mergeAdjoiningCities(obj: Field): Set<FeaturePointer> {
    return this.adjoiningCities.union(obj.adjoiningCities);
  }

  protected placeOnBoardAdjoiningCities(pos: Position, rot: Rotation): Set<FeaturePointer> {
    return this.adjoiningCities.map((fp) => fp.rotateCW(rot).translate(pos));
  }
}

// Wire the Field-class predicate used by FeaturePointer.getAdjacent (breaks the cycle).
__setIsFieldClass((c) => c === Field);
