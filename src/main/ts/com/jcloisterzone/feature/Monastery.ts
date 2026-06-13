import { Tuple2 } from "../../../io/vavr/Tuple.js";
import { HashMap, type Map as VMap } from "../../../io/vavr/Map.js";
import { HashSet, type Set } from "../../../io/vavr/Set.js";
import { List, Stream } from "../../../io/vavr/SeqTypes.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { ExprItem } from "../event/ExprItem.js";
import { PointsExpression } from "../event/PointsExpression.js";
import type { Player } from "../Player.js";
import { Follower } from "../figure/Follower.js";
import type { Meeple } from "../figure/Meeple.js";
import { GameElementQuery } from "../game/setup/GameElementQuery.js";
import { VineyardCapability } from "../game/capability/VineyardCapability.js";
import type { WagonEligible } from "../game/capability/trait/WagonEligible.js";
import type { GameState } from "../game/state/GameState.js";
import type { PlacedTile } from "../game/state/PlacedTile.js";
import type { Feature } from "./Feature.js";
import type { ModifiedFeature } from "./ModifiedFeature.js";
import { MonasticFeature } from "./MonasticFeature.js";
import type { NeighbouringFeature } from "./NeighbouringFeature.js";
import { BooleanAnyModifier } from "./modifier/BooleanAnyModifier.js";
import type { BooleanModifier } from "./modifier/BooleanModifier.js";
import type { FeatureModifier } from "./modifier/FeatureModifier.js";
import * as ModifierSupport from "./modifier/ModifierSupport.js";

/** Monastery / shrine / special monastery / Darmstadt church. */
export class Monastery extends MonasticFeature implements ModifiedFeature, WagonEligible {
  isWagonEligible(): true {
    return true;
  }

  static readonly simpleName = "Monastery";

  private static readonly INITIAL_PLACE = List.of(
    new FeaturePointer(Position.ZERO, Monastery, Location.I),
  );

  static readonly SHRINE = new BooleanAnyModifier("monastery[shrine]", new GameElementQuery("shrine"));
  static readonly SPECIAL_MONASTERY = new BooleanAnyModifier("monastery[special]", null);
  static readonly CHURCH = new BooleanAnyModifier("monastery[church]", new GameElementQuery("church"));

  private readonly modifiers: VMap<FeatureModifier<unknown>, unknown>;

  constructor(modifiers: VMap<FeatureModifier<unknown>, unknown>);
  constructor(
    places: List<FeaturePointer>,
    neighboring: Set<FeaturePointer>,
    modifiers: VMap<FeatureModifier<unknown>, unknown>,
  );
  constructor(
    a: VMap<FeatureModifier<unknown>, unknown> | List<FeaturePointer>,
    neighboring?: Set<FeaturePointer>,
    modifiers?: VMap<FeatureModifier<unknown>, unknown>,
  ) {
    if (a instanceof List) {
      super(a, neighboring!);
      this.modifiers = modifiers!;
    } else {
      super(Monastery.INITIAL_PLACE, HashSet.empty<FeaturePointer>());
      this.modifiers = a;
    }
  }

  // --- ModifiedFeature ---
  getModifiers(): VMap<FeatureModifier<unknown>, unknown> {
    return this.modifiers;
  }

  setModifiers(modifiers: VMap<FeatureModifier<unknown>, unknown>): Monastery {
    if (this.modifiers === modifiers) return this;
    return new Monastery(this.places, this.neighboring, modifiers);
  }

  putModifier<T>(modifier: FeatureModifier<T>, value: T): Monastery {
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

  mergeModifiers(otherModifiers: VMap<FeatureModifier<unknown>, unknown>): VMap<FeatureModifier<unknown>, unknown> {
    return ModifierSupport.mergeModifierMaps(this.modifiers, otherModifiers);
  }

  // --- Neighbouring / placement ---
  override setNeighboring(neighboring: Set<FeaturePointer>): Monastery {
    if (this.neighboring === neighboring) return this;
    return new Monastery(this.places, neighboring, this.modifiers);
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new Monastery(
      this.placeOnBoardPlaces(pos, rot),
      this.placeOnBoardNeighboring(pos, rot),
      this.modifiers,
    );
  }

  // --- modifier queries ---
  isShrine(state: GameState): boolean {
    return this.hasModifier(state, Monastery.SHRINE);
  }

  isSpecialMonastery(state: GameState): boolean {
    return this.hasModifier(state, Monastery.SPECIAL_MONASTERY);
  }

  isChurch(state: GameState): boolean {
    return this.hasModifier(state, Monastery.CHURCH);
  }

  // --- meeples (incl. abbot space for special monasteries) ---
  getMeeplesIncludingSpecialMonastery2(state: GameState): Stream<Tuple2<Meeple, FeaturePointer>> {
    if (this.isSpecialMonastery(state)) {
      const place = this.places.head();
      const fps = HashSet.of(
        place,
        new FeaturePointer(place.getPosition(), Monastery, Location.AS_ABBOT),
      );
      return Stream.ofAll(state.getDeployedMeeples()).filter((t) => fps.contains(t._2)) as Stream<
        Tuple2<Meeple, FeaturePointer>
      >;
    }
    return this.getMeeples2(state);
  }

  getMeeplesIncludingMonastery(state: GameState): Stream<Meeple> {
    if (this.isSpecialMonastery(state)) {
      return this.getMeeplesIncludingSpecialMonastery2(state).map((t) => t._1) as Stream<Meeple>;
    }
    return this.getMeeples(state);
  }

  getMonasteryFollowers2(state: GameState): Stream<Tuple2<Follower, FeaturePointer>> {
    const place = this.getPlace().setLocation(Location.AS_ABBOT);
    return Stream.ofAll(state.getDeployedMeeples())
      .filter((t) => t._1 instanceof Follower && t._2.equals(place))
      .map((t) => t.map1((f) => f as Follower)) as Stream<Tuple2<Follower, FeaturePointer>>;
  }

  getMonasteryPowers(state: GameState): HashMap<Player, number> {
    return this.getMonasteryFollowers2(state).foldLeft(
      HashMap.empty<Player, number>() as VMap<Player, number>,
      (acc, follower2) => {
        const follower = follower2._1;
        const player = follower.getPlayer();
        const power = follower.getPower(state, this);
        const p = acc.get(player).getOrElse(0);
        return acc.put(player, p + power);
      },
    ) as HashMap<Player, number>;
  }

  getMonasteryOwners(state: GameState): Set<Player> {
    const powers = this.getMonasteryPowers(state);
    const maxPower = powers
      .values()
      .maxBy((x) => x)
      .getOrElse(0);
    if (maxPower === 0) {
      return HashSet.empty<Player>();
    }
    return powers.filterValues((p) => p === maxPower).keySet();
  }

  getMonasterySampleFollower(state: GameState, player: Player): Follower | null {
    return this.getMonasteryFollowers2(state)
      .map((t) => t._1)
      .find((f) => f.getPlayer().equals(player))
      .getOrNull();
  }

  // --- scoring ---
  getStructurePoints(state: GameState, completed: boolean): PointsExpression {
    const scoreVineyards = state.hasCapability(VineyardCapability);
    let adjacent = 0;
    let adjacentVineyards = 0;
    for (const t of state.getAdjacentAndDiagonalTiles2(this.places.head().getPosition())) {
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
    const baseName = this.isShrine(state) ? "shrine" : "monastery";
    return new PointsExpression(
      completed ? baseName : baseName + ".incomplete",
      List.ofAll(exprItems),
    );
  }

  override getRangeTiles(state: GameState): Stream<PlacedTile> {
    if (this.isSpecialMonastery(state)) {
      return this.getRangeTilesSpecialMonastery(state);
    }
    return state
      .getAdjacentAndDiagonalTiles2(this.getPlace().getPosition())
      .map((t) => t._2)
      .append(state.getPlacedTile(this.getPlace().getPosition())!) as Stream<PlacedTile>;
  }

  private getRangeTilesSpecialMonastery(state: GameState): Stream<PlacedTile> {
    const monasteryPosition = this.getPosition();
    let tiles: List<PlacedTile> = List.empty<PlacedTile>();
    for (const direction of Location.SIDES) {
      let pos = monasteryPosition.add(direction);
      while (state.getPlacedTiles().containsKey(pos)) {
        tiles = tiles.append(state.getPlacedTiles().get(pos).get()) as List<PlacedTile>;
        pos = pos.add(direction);
      }
    }
    return Stream.ofAll(tiles) as Stream<PlacedTile>;
  }
}
