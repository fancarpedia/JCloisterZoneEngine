import { HashSet } from "../../../../io/vavr/Set.js";
import { Stream, List } from "../../../../io/vavr/SeqTypes.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import type { ClassToken } from "../../../../lang/Class.js";
import type { Position } from "../../board/Position.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { DiceSixRollEvent } from "../../event/DiceSixRollEvent.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import { City } from "../../feature/City.js";
import type { Feature } from "../../feature/Feature.js";
import type { FeatureModifier } from "../../feature/modifier/FeatureModifier.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { GamblersLuckCapability } from "../capability/GamblersLuckCapability.js";
import { FamiliesCapability } from "../capability/FamiliesCapability.js";
import type { GameState } from "../state/GameState.js";
import { Phase } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

type ShieldToken = GamblersLuckCapability.GamblersLuckShieldToken;
type DiceRow = [number | null, string | null, ShieldToken];
type ModMap = VMap<FeatureModifier<unknown>, unknown>;

const T = GamblersLuckCapability.GamblersLuckShieldToken;

/** die value → [pennants gained (null = eliminates pennants), family colour, token]. */
const DICE_REGULAR = new globalThis.Map<number, DiceRow>([
  [1, [1, "grey", T.GAMBLERSLUCKSHIELD_1]],
  [2, [2, "grey" /* both */, T.GAMBLERSLUCKSHIELD_2]],
  [3, [3, "grey", T.GAMBLERSLUCKSHIELD_3]],
  [4, [null, null, T.GAMBLERSLUCKSHIELD_X]],
  [5, [0, null, T.GAMBLERSLUCKSHIELD_0]],
  [6, [0, null, T.GAMBLERSLUCKSHIELD_0]],
]);
const DICE_MAYOR = new globalThis.Map<number, DiceRow>([
  [1, [1, "grey", T.GAMBLERSLUCKSHIELD_1]],
  [2, [2, "grey", T.GAMBLERSLUCKSHIELD_2]],
  [3, [null, null, T.GAMBLERSLUCKSHIELD_X]],
  [4, [null, null, T.GAMBLERSLUCKSHIELD_X]],
  [5, [0, null, T.GAMBLERSLUCKSHIELD_0]],
  [6, [0, null, T.GAMBLERSLUCKSHIELD_0]],
]);

function findByToken(dice: globalThis.Map<number, DiceRow>, token: ShieldToken): DiceRow {
  for (const row of dice.values()) {
    if (row[2] === token) return row;
  }
  throw new Error("Unknown shield token");
}

const CAP_CLS = GamblersLuckCapability as unknown as ClassToken<GamblersLuckCapability>;

/** After the action commit, rolls a d6 for every gamblers-luck shield on the placed
 *  tile: the result becomes a shield token (+ random extra rotation for the client)
 *  and rewrites the tile's city pennants / family modifiers accordingly. */
export class GamblersLuckDicePhase extends Phase {
  static readonly simpleName = "GamblersLuckDicePhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    const pos = state.getLastPlaced()!.getPosition();
    const cap = state.getCapabilities().get(CAP_CLS) as GamblersLuckCapability;

    const shields = cap.getPlacedTileGamblersLuckShields(state);
    if (shields.length() === 0) {
      return this.next(state);
    }

    let model = cap.getModel(state) as VMap<FeaturePointer, Tuple2<ShieldToken, number>>;
    const dice =
      state.getElements().get("mayor").getOrNull() !== null &&
      state.getElements().get("mayor").getOrNull() !== undefined
        ? DICE_MAYOR
        : DICE_REGULAR;

    for (const shield of shields) {
      const diceValue = this.getRandom().getNextInt(6) + 1;
      const randomRotation = this.getRandom().getNextInt(8) - 5;
      model = model.put(shield._1, new Tuple2(dice.get(diceValue)![2], randomRotation));
      state = state.appendEvent(
        new DiceSixRollEvent(
          PlayEventMeta.createWithActivePlayer(state),
          HashSet.of(pos),
          diceValue,
          `gamblers-luck-dice.${dice.get(diceValue)![2].name()}`,
        ),
      );
    }
    state = cap.setModel(state, model);

    for (const cityEntry of state.getPlacedTile(pos)!.getTile().getInitialFeatures()) {
      if (!(cityEntry._2 instanceof City)) continue;
      const city = cityEntry._2;
      const initialShields = city.getModifier(
        state,
        City.GAMBLERS_LUCK_SHIELDS,
        Stream.empty<FeaturePointer>(),
      );
      let placedShields: Stream<FeaturePointer> = Stream.empty<FeaturePointer>();
      let newShields = city.getModifier(state, City.PENNANTS, 0);
      let eliminatedPennants = false;
      let family: string | null = null;
      for (const initialShield of initialShields) {
        const placedShield = initialShield.setPosition(pos);
        placedShields = placedShields.append(placedShield) as Stream<FeaturePointer>;
        const currentToken = model.get(placedShield).getOrNull();
        const diceRow = findByToken(dice, currentToken!._1);
        if (diceRow[0] === null) {
          eliminatedPennants = true;
        } else if (diceRow[0] > 0) {
          newShields += diceRow[0];
          if (family === null || family !== "both") {
            family = diceRow[1];
          }
        }
      }
      let modifiers: ModMap = city.getModifiers();
      if (eliminatedPennants) {
        modifiers = modifiers.put(City.ELIMINATED_PENNANTS as unknown as FeatureModifier<unknown>, eliminatedPennants);
      }
      if (newShields > 0) {
        modifiers = modifiers.put(City.PENNANTS as unknown as FeatureModifier<unknown>, newShields);
        modifiers = modifiers.put(FamiliesCapability.FAMILY as unknown as FeatureModifier<unknown>, family);
      }
      // vavr Map.replace(key, oldValue, newValue): only replaces an existing mapping
      const key = City.GAMBLERS_LUCK_SHIELDS as unknown as FeatureModifier<unknown>;
      if (modifiers.containsKey(key)) {
        modifiers = modifiers.put(key, placedShields);
      }

      state = this.updatedInitialFeatures(state, pos, new Tuple2(cityEntry._1, city), modifiers);
    }

    return this.next(state);
  }

  private updatedInitialFeatures(
    state: GameState,
    pos: Position,
    city: Tuple2<FeaturePointer, City>,
    modifiers: ModMap,
  ): GameState {
    // update the city's modifiers inside the placed tile's initial features
    const tile = state.getPlacedTile(pos)!.getTile();
    const features = tile.getInitialFeatures();
    const updatedTile = tile.setInitialFeatures(
      features.put(
        city._1,
        features
          .get(city._1)
          .map((f) => (f as City).setModifiers(modifiers) as unknown as Feature)
          .getOrElse(() => city._2.setModifiers(modifiers) as unknown as Feature),
      ),
    );
    let placedTiles = state.getPlacedTiles();
    const updatedPlacedTile = placedTiles
      .get(pos)
      .map((pt) => pt.setTile(updatedTile))
      .getOrElseThrow(() => new Error("No tile at position " + pos));
    placedTiles = placedTiles.put(pos, updatedPlacedTile) as typeof placedTiles;
    state = state.setPlacedTiles(placedTiles);

    // recompute the merged on-board city's modifiers from its tiles' initial features
    const cityOnBoard = city._1.setPosition(pos).rotateCW(state.getPlacedTile(pos)!.getRotation());
    if (state.getFeature(cityOnBoard) === null) {
      // the city was already transformed to a castle — skip
      return state;
    }

    const places = state.getFeature(cityOnBoard)!.getPlaces();
    const initialFeatures = places.map((fp) => {
      const pt = state.getPlacedTile(fp.getPosition())!;
      return pt.getInitialFeaturePartOf(fp.getLocation()!)!._2.placeOnBoard(
        fp.getPosition(),
        pt.getRotation(),
      ) as City;
    }) as List<City>;

    let updatedModifiers: ModMap = HashMap.empty<FeatureModifier<unknown>, unknown>();
    for (const c of initialFeatures) {
      updatedModifiers = c.mergeModifiers(updatedModifiers);
    }

    return this.updateCityComplex(state, cityOnBoard, updatedModifiers);
  }

  /** Re-point every FeaturePointer of the merged city at a modifier-updated copy. */
  private updateCityComplex(
    state: GameState,
    cityPointer: FeaturePointer,
    modifiers: ModMap,
  ): GameState {
    const originalCity = state.getFeature(cityPointer) as City;
    const updatedCity = originalCity.setModifiers(modifiers);
    let featureMapUpdate: VMap<FeaturePointer, Feature> = HashMap.empty<FeaturePointer, Feature>();
    for (const fp of originalCity.getPlaces()) {
      featureMapUpdate = featureMapUpdate.put(fp, updatedCity as unknown as Feature);
    }
    return state.updateFeatureMap(featureMapUpdate);
  }
}
