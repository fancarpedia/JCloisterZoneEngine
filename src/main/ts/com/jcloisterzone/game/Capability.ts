import { HashMap } from "../../../io/vavr/Map.js";
import type { List } from "../../../io/vavr/SeqTypes.js";
import type { Set } from "../../../io/vavr/Set.js";
import { type ClassToken, simpleName } from "../../../lang/Class.js";
import type { Position } from "../board/Position.js";
import type { PlacementOption } from "../board/PlacementOption.js";
import type { Tile } from "../board/Tile.js";
import type { XmlElement } from "../XmlUtils.js";
import type { ReceivedPoints } from "../event/ScoreEvent.js";
import type { Completable } from "../feature/Completable.js";
import type { Feature } from "../feature/Feature.js";
import type { Scoreable } from "../feature/Scoreable.js";
import type { Special } from "../figure/Special.js";
import type { RandomGenerator } from "../random/RandomGenerator.js";
import type { ScoreFeatureReducer } from "./ScoreFeatureReducer.js";
import type { GameState } from "./state/GameState.js";
import type { PlacedTile } from "./state/PlacedTile.js";

/**
 * Base for all game capabilities (expansions). Subclasses override the lifecycle
 * hooks; defaults are no-ops. Java reflection (Class.forName) is replaced by a
 * name→class registry that capabilities register into.
 */
export abstract class Capability<T> {
  private static readonly registry = new Map<string, ClassToken<Capability<unknown>>>();

  private narrowClass(): ClassToken<Capability<T>> {
    return (this as object).constructor as ClassToken<Capability<T>>;
  }

  getModel(state: GameState): T {
    return state.getCapabilityModel<T>(this.narrowClass());
  }

  updateModel(state: GameState, fn: (model: T) => T): GameState {
    return state.mapCapabilityModel(this.narrowClass(), fn);
  }

  setModel(state: GameState, model: T): GameState {
    return state.setCapabilityModel(this.narrowClass(), model);
  }

  /** May throw RemoveTileException to exclude the tile. `tileElement` is XML. */
  initTile(state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    return tile;
  }

  initFeature(settings: GameState, tileId: string, feature: Feature, xml: XmlElement): Feature {
    return feature;
  }

  getTileGroup(tile: Tile): string | null {
    return null;
  }

  onStartGame(state: GameState, random: RandomGenerator): GameState {
    return state;
  }

  onTilePlaced(state: GameState, placedTile: PlacedTile): GameState {
    return state;
  }

  beforeCompletableScore(state: GameState, features: Set<Completable>): GameState {
    return state;
  }

  appendFiguresBonusPoints(
    state: GameState,
    bonusPoints: List<ReceivedPoints>,
    feature: Scoreable,
    isFinal: boolean,
  ): List<ReceivedPoints> {
    return bonusPoints;
  }

  appendSpecialFiguresBonusPoints(
    state: GameState,
    bonusPoints: List<ReceivedPoints>,
    figure: Special,
    isFinal: boolean,
  ): List<ReceivedPoints> {
    return bonusPoints;
  }

  onTurnScoring(state: GameState, completed: HashMap<Scoreable, ScoreFeatureReducer>): GameState {
    return state;
  }

  onActionPhaseEntered(state: GameState): GameState {
    return state;
  }

  onTurnCleanUp(state: GameState): GameState {
    return state;
  }

  onTurnPartCleanUp(state: GameState): GameState {
    return state;
  }

  onFinalScoring(state: GameState): GameState {
    return state;
  }

  isTilePlacementAllowed(state: GameState, tile: Tile, placement: PlacementOption): boolean {
    return true;
  }

  isMeepleDeploymentAllowed(state: GameState, pos: Position): boolean {
    return true;
  }

  onMeteoriteImpact(state: GameState, pt: PlacedTile, positions: Set<Position>): GameState {
    return state;
  }

  toString(): string {
    return Capability.nameForClass((this as object).constructor as ClassToken<Capability<unknown>>);
  }

  // --- registry (replaces Class.forName reflection) ---
  static register(cls: ClassToken<Capability<unknown>>): void {
    Capability.registry.set(Capability.nameForClass(cls), cls);
  }

  static classForName(name: string): ClassToken<Capability<unknown>> {
    const cls = Capability.registry.get(name);
    if (!cls) {
      throw new Error("Unknown capability: " + name);
    }
    return cls;
  }

  /** Like classForName but returns null instead of throwing (used to avoid import
   *  cycles when a low-level class needs a capability token by name). */
  static tryClassForName(name: string): ClassToken<Capability<unknown>> | null {
    return Capability.registry.get(name) ?? null;
  }

  static nameForClass(cls: ClassToken<Capability<unknown>>): string {
    // Strip a leading underscore: some bundlers (esbuild/SWC, used by the test runner)
    // emit class names as `_TowerCapability` when the class self-references in static
    // members. Without this, the registry key would be `_Tower` and a by-name lookup
    // (e.g. Follower.isCaptured -> tryClassForName("Tower")) would miss it.
    return simpleName(cls).replace(/^_+/, "").replace(/Capability$/, "");
  }
}
