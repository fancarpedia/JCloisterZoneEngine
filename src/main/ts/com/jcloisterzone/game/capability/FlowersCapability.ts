import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { List, Stream } from "../../../../io/vavr/SeqTypes.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import type { Player } from "../../Player.js";
import type { Position } from "../../board/Position.js";
import { ScoreMeeplePositionsPointer } from "../../board/pointer/ScoreMeeplePositionsPointer.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { CompletableFeature } from "../../feature/CompletableFeature.js";
import { Field } from "../../feature/Field.js";
import { Monastery } from "../../feature/Monastery.js";
import type { Scoreable } from "../../feature/Scoreable.js";
import { isInstanceOfRangeFeature } from "../../feature/RangeFeature.js";
import type { Follower } from "../../figure/Follower.js";
import type { Meeple } from "../../figure/Meeple.js";
import type { Special } from "../../figure/Special.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { Capability } from "../Capability.js";
import { FlowersToken } from "../token/FlowersToken.js";
import { isInstanceOfFlowersBonusAffected } from "./trait/FlowersBonusAffected.js";
import type { GameState } from "../state/GameState.js";
import type { PlacedTile } from "../state/PlacedTile.js";

/** Flowers (Village Life): every player draws one random flower-colour token at game
 *  start (visible in player tokens); whenever a feature is scored, each follower owner
 *  whose token colour matches flowers on the feature's tiles gets +3 per flower —
 *  emitted as an extra "flowers" scoring event. */
export class FlowersCapability extends Capability<void> {
  override onStartGame(state: GameState, random: RandomGenerator): GameState {
    let ps = state.getPlayers();
    const multiplier = Math.ceil(ps.getPlayers().length() / 4.0); // 1 for 1–4 players, 2 for 5–8, …

    let pool: List<FlowersToken> = List.empty<FlowersToken>();
    for (let i = 0; i < multiplier; i++) {
      pool = pool.appendAll(FlowersToken.values()) as List<FlowersToken>;
    }

    for (const p of ps.getPlayers()) {
      const idx = random.getNextInt(pool.size());
      const token = pool.get(idx);
      pool = pool.removeAt(idx) as List<FlowersToken>;
      ps = ps.setTokenCount(p.getIndex(), token, 1);
    }

    return state.setPlayers(ps);
  }

  override appendFiguresBonusPoints(
    state: GameState,
    bonusPoints: List<ReceivedPoints>,
    feature: Scoreable,
    isFinal: boolean,
  ): List<ReceivedPoints> {
    let featureFlowers: VMap<string, number> = HashMap.empty<string, number>();
    let tiles: Stream<PlacedTile> = Stream.empty<PlacedTile>();

    if (feature instanceof Field && isFinal) {
      featureFlowers = feature.getModifier(state, Field.FLOWERS, HashMap.empty<string, number>());
      tiles = Stream.ofAll(feature.getTilePositions()).map(
        (pos) => state.getPlacedTiles().get(pos).get(),
      ) as Stream<PlacedTile>;
    } else if (isInstanceOfFlowersBonusAffected(feature)) {
      if (feature instanceof Monastery) {
        if (feature.isSpecialMonastery(state)) {
          if (isFinal) {
            tiles = feature.getRangeTiles(state);
          }
        } else {
          tiles = feature.getRangeTiles(state);
        }
      } else if (isInstanceOfRangeFeature(feature)) {
        tiles = (feature as unknown as { getRangeTiles(s: GameState): Stream<PlacedTile> }).getRangeTiles(state);
      } else if (feature instanceof CompletableFeature) {
        tiles = Stream.ofAll(feature.getTilePositions()).map(
          (pos) => state.getPlacedTiles().get(pos).get(),
        ) as Stream<PlacedTile>;
      } else {
        throw new Error("Unknown feature type for FlowersBonus " + String(feature));
      }
      featureFlowers = this.getFlowersOnTiles(state, tiles);
    }

    if (!featureFlowers.isEmpty()) {
      const followers: Stream<Follower> = (
        feature instanceof Monastery && feature.isSpecialMonastery(state)
          ? (Stream.ofAll(feature.getMonasteryFollowers2(state)).map((t) => t._1) as Stream<Follower>)
          : (feature.getFollowers(state) as Stream<Follower>)
      ).distinctBy((f: Follower) => f.getPlayer()) as Stream<Follower>;

      let positions: Set<Position> = HashSet.empty<Position>();
      for (const t of tiles) positions = positions.add(t.getPosition());
      bonusPoints = this.appendBonusPoints(
        state,
        bonusPoints,
        featureFlowers,
        followers as unknown as Stream<Meeple>,
        positions,
      );
    }
    return bonusPoints;
  }

  override appendSpecialFiguresBonusPoints(
    state: GameState,
    bonusPoints: List<ReceivedPoints>,
    figure: Special,
    isFinal: boolean,
  ): List<ReceivedPoints> {
    void isFinal;
    let tiles: Stream<PlacedTile> = Stream.empty<PlacedTile>();
    if (isInstanceOfFlowersBonusAffected(figure)) {
      tiles = (figure as unknown as { getRangeTiles(s: GameState): Stream<PlacedTile> }).getRangeTiles(state);
    }
    const flowersInRange = this.getFlowersOnTiles(state, tiles);
    let positions: Set<Position> = HashSet.empty<Position>();
    for (const t of tiles) positions = positions.add(t.getPosition());
    return this.appendBonusPoints(
      state,
      bonusPoints,
      flowersInRange,
      Stream.of(figure as unknown as Meeple),
      positions,
    );
  }

  private getFlowersOnTiles(state: GameState, tiles: Stream<PlacedTile>): VMap<string, number> {
    let flowers: VMap<string, number> = HashMap.empty<string, number>();
    for (const t of tiles) {
      for (const entry of t.getTile().getInitialFeatures()) {
        if (!(entry._2 instanceof Field)) continue;
        const fieldFlowers = entry._2.getModifier(state, Field.FLOWERS, HashMap.empty<string, number>());
        for (const ff of fieldFlowers) {
          flowers = flowers.put(ff._1, flowers.get(ff._1).getOrElse(0) + ff._2);
        }
      }
    }
    return flowers;
  }

  private appendBonusPoints(
    state: GameState,
    bonusPoints: List<ReceivedPoints>,
    flowersList: VMap<string, number>,
    figures: Stream<Meeple>,
    positions: Set<Position>,
  ): List<ReceivedPoints> {
    if (figures.size() > 0) {
      const ps = state.getPlayers();
      const playersWithToken = (token: FlowersToken): Player[] =>
        ps
          .getPlayers()
          .toArray()
          .filter((p) => ps.getPlayerTokenCount(p.getIndex(), token) > 0);

      for (const flowers of flowersList) {
        const token = FlowersToken.fromValue(flowers._1);
        const expr = new ExprItem(flowers._2, "flowers." + token.name(), 3 * flowers._2);
        for (const player of playersWithToken(token)) {
          bonusPoints = bonusPoints.appendAll(
            figures
              .filter((f) => f.getPlayer().equals(player))
              .map(
                (f) =>
                  new ReceivedPoints(
                    new PointsExpression("flowers", expr),
                    player,
                    new ScoreMeeplePositionsPointer(f.getDeployment(state)!, f.getId(), positions),
                  ),
              ),
          ) as List<ReceivedPoints>;
        }
      }
    }
    return bonusPoints;
  }
}

Capability.register(FlowersCapability);
