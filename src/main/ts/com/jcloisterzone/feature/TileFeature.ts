import { Tuple2 } from "../../../io/vavr/Tuple.js";
import { HashSet, type Set } from "../../../io/vavr/Set.js";
import { List, Stream } from "../../../io/vavr/SeqTypes.js";
import type { ClassToken } from "../../../lang/Class.js";
import type { Player } from "../Player.js";
import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Follower } from "../figure/Follower.js";
import type { Meeple } from "../figure/Meeple.js";
import type { Special } from "../figure/Special.js";
import type { Capability } from "../game/Capability.js";
import type { GameState } from "../game/state/GameState.js";
import type { Feature } from "./Feature.js";
import type { Structure } from "./Structure.js";

/**
 * Abstract base for features stored on tiles (holds the `places` list) and
 * provides the Java {@code Structure} interface default methods. Concrete
 * non-scoreable structures (Quarter, edge features via subclasses) extend this.
 */
export abstract class TileFeature implements Structure {
  protected readonly places: List<FeaturePointer>;

  constructor(places: List<FeaturePointer>) {
    this.places = places;
  }

  getPlaces(): List<FeaturePointer> {
    return this.places;
  }

  getPlace(): FeaturePointer {
    return this.places.head();
  }

  abstract placeOnBoard(pos: Position, rot: Rotation): Feature;

  toString(): string {
    return (this.constructor as { simpleName?: string }).simpleName ?? this.constructor.name;
  }

  // --- Feature default ---
  getTilePositions(): Set<Position> {
    return HashSet.ofAll(this.places.map((fp) => fp.getPosition()).toArray());
  }

  /** Whether this is a {@link Structure} (a meeple-deployable feature). In the Java
   *  hierarchy TileFeature is only a Feature; the pure EdgeFeature subclasses
   *  (AbbeyEdge/Bush/CityGate) are NOT Structures and override this to false. */
  isStructure(): boolean {
    return true;
  }

  // --- Structure defaults ---
  getMeeples2(state: GameState): Stream<Tuple2<Meeple, FeaturePointer>> {
    const fps = HashSet.ofAll(this.places);
    return Stream.ofAll(state.getDeployedMeeples()).filter((t) => fps.contains(t._2)) as Stream<
      Tuple2<Meeple, FeaturePointer>
    >;
  }

  getMeeples(state: GameState): Stream<Meeple> {
    return this.getMeeples2(state).map((t) => t._1) as Stream<Meeple>;
  }

  getFollowers2(state: GameState): Stream<Tuple2<Follower, FeaturePointer>> {
    return this.getMeeples2(state)
      .filter((t) => t._1.isFollower())
      .map((t) => t.map1((f) => f as Follower)) as Stream<Tuple2<Follower, FeaturePointer>>;
  }

  getFollowers(state: GameState): Stream<Follower> {
    return this.getFollowers2(state).map((t) => t._1) as Stream<Follower>;
  }

  getSpecialMeeples2(state: GameState): Stream<Tuple2<Special, FeaturePointer>> {
    return this.getMeeples2(state)
      .filter((t) => t._1.isSpecial())
      .map((t) => t.map1((m) => m as Special)) as Stream<Tuple2<Special, FeaturePointer>>;
  }

  getSpecialMeeples(state: GameState): Stream<Special> {
    return this.getSpecialMeeples2(state).map((t) => t._1) as Stream<Special>;
  }

  isOccupied(state: GameState): boolean {
    return !this.getMeeples(state).isEmpty();
  }

  isOccupiedBy(state: GameState, p: Player): boolean {
    return !this.getFollowers(state).find((m) => m.getPlayer().equals(p)).isEmpty();
  }

  getRequiredCapability(): ClassToken<Capability<unknown>> | null {
    return null;
  }

  // --- EdgeFeature defaults (harmless for non-edge features) ---
  isMergeableWith(other: { constructor: unknown }): boolean {
    return this.constructor === other.constructor;
  }

  getProxyTarget(): FeaturePointer | null {
    return null;
  }

  // --- immutable helpers ---
  protected mergePlaces(obj: TileFeature): List<FeaturePointer> {
    return this.places.appendAll(obj.places) as List<FeaturePointer>;
  }

  protected placeOnBoardPlaces(pos: Position, rot: Rotation): List<FeaturePointer> {
    return this.places.map((fp) => fp.rotateCW(rot).translate(pos)) as List<FeaturePointer>;
  }
}
