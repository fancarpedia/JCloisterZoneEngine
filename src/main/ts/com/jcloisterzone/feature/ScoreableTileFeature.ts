import { Tuple2 } from "../../../io/vavr/Tuple.js";
import { HashMap, type Map as VMap } from "../../../io/vavr/Map.js";
import { List } from "../../../io/vavr/SeqTypes.js";
import { HashSet, type Set } from "../../../io/vavr/Set.js";
import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { ExprItem } from "../event/ExprItem.js";
import type { Follower } from "../figure/Follower.js";
import { Rule } from "../game/Rule.js";
import { HillCapability } from "../game/capability/HillCapability.js";
import { LittleBuildingsCapability } from "../game/capability/LittleBuildingsCapability.js";
import type { GameState } from "../game/state/GameState.js";
import type { Scoreable } from "./Scoreable.js";
import { TileFeature } from "./TileFeature.js";

/**
 * Synthetic port-only base: provides the Java {@code Scoreable} interface default
 * methods (powers/owners/sample follower/little buildings) on top of TileFeature.
 * Castle and Field extend this directly; City/Road/Monastic extend it transitively.
 */
export abstract class ScoreableTileFeature extends TileFeature implements Scoreable {
  getPowers(state: GameState): HashMap<Player, Tuple2<number, number>> {
    const useHillTiebreaker = state.hasCapability(HillCapability);
    const useOnHillCount = state.getStringRule(Rule.HILL_TIEBREAKER) === "number-of-followers";
    const result = this.getFollowers2(state).foldLeft(
      HashMap.empty<Player, Tuple2<number, number>>() as VMap<Player, Tuple2<number, number>>,
      (acc, follower2) => {
        const follower = follower2._1;
        const fp = follower2._2;
        const player = follower.getPlayer();
        const power = follower.getPower(state, this);
        let t = acc.get(player).getOrElse(new Tuple2(0, 0));
        t = t.map1((p) => p + power);
        if (useHillTiebreaker) {
          const onHill = state
            .getPlacedTile(fp.getPosition())!
            .getTile()
            .hasModifier(HillCapability.HILL);
          if (onHill) {
            if (useOnHillCount) {
              t = t.map2((cnt) => cnt + 1);
            } else if (t._2 === 0) {
              t = t.update2(1);
            }
          }
        }
        return acc.put(player, t);
      },
    );
    return result as HashMap<Player, Tuple2<number, number>>;
  }

  getOwners(state: GameState): Set<Player> {
    const powers = this.getPowers(state);
    const maxPower = powers
      .values()
      .map((t) => t._1)
      .maxBy((x) => x)
      .getOrElse(0);
    // can be 0 for Mayor on a city without pennant -> no owners
    if (maxPower === 0) {
      return HashSet.empty<Player>();
    }
    const maxTiebreaker = powers
      .values()
      .filter((t) => t._1 === maxPower)
      .map((t) => t._2)
      .maxBy((x) => x)
      .getOrElse(0);
    return powers.filterValues((t) => t._1 === maxPower && t._2 === maxTiebreaker).keySet();
  }

  getSampleFollower(state: GameState, player: Player): Follower | null {
    return this.getFollowers(state)
      .find((f) => f.getPlayer().equals(player))
      .getOrNull();
  }

  getSampleFollower2(state: GameState, player: Player): Tuple2<Follower, FeaturePointer> | null {
    return this.getFollowers2(state)
      .find((t) => t._1.getPlayer().equals(player))
      .getOrNull();
  }

  getLittleBuildingPoints(state: GameState): List<ExprItem> {
    const buildings = state.getCapabilityModel<
      VMap<import("../board/Position.js").Position, LittleBuildingsCapability.LittleBuilding>
    >(LittleBuildingsCapability);
    if (buildings === null) {
      return List.empty<ExprItem>();
    }
    const position = this.getTilePositions();
    const buildingsSeq = buildings.filterKeys((pos) => position.contains(pos)).values();
    return LittleBuildingsCapability.getBuildingsPoints(state, buildingsSeq);
  }
}
