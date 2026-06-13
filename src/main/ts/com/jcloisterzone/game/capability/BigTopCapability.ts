import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { List } from "../../../../io/vavr/SeqTypes.js";
import type { Player } from "../../Player.js";
import { Position } from "../../board/Position.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { TokenPlacedEvent } from "../../event/TokenPlacedEvent.js";
import { Circus } from "../../feature/Circus.js";
import { Follower } from "../../figure/Follower.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { BigTop } from "../../figure/neutral/BigTop.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import { Capability } from "../Capability.js";
import { AnimalToken } from "./AnimalToken.js";
import type { GameState } from "../state/GameState.js";

/** Big Top (Under the Big Top): the Big Top neutral figure walks from circus to circus, and
 *  whenever it leaves one it scores all followers adjacent to (and on) that tile by a random
 *  unused animal token's value. Model = number of animal-token sets in play. */
export class BigTopCapability extends Capability<number> {
  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    state = state.mapNeutralFigures((nf) => nf.setBigTop(new BigTop("bigtop.1")));

    let circusCount = 0;
    for (const g of state.getTilePack()!.getGroups().values()) {
      for (const tile of g.getTiles()) {
        if (tile.getInitialFeatures().exists((t) => t._2 instanceof Circus)) circusCount++;
      }
    }
    let tokensPerSet = 0;
    for (const t of AnimalToken.values()) tokensPerSet += t.count;

    return this.setModel(state, Math.ceil(circusCount / tokensPerSet));
  }

  override onFinalScoring(state: GameState): GameState {
    const pos = state.getNeutralFigures().getBigTopDeployment();
    if (pos !== null) {
      const tokens = this.getUnusedTokens(state);
      const idx = state.getPhase()!.getRandom().getNextInt(tokens.length);
      return this.scoreBigTop(state, pos, tokens[idx], true);
    }
    return state;
  }

  scoreBigTop(state: GameState, pos: Position, token: AnimalToken, _isFinal: boolean): GameState {
    // record the token even if nobody scores from it
    state = state.appendEvent(
      new TokenPlacedEvent(PlayEventMeta.createWithoutPlayer(), token, pos as unknown as BoardPointer),
    );

    let positions: Set<Position> = HashSet.empty<Position>();
    for (const pt of Position.ADJACENT_AND_DIAGONAL) positions = positions.add(pos.add(pt._2));
    positions = positions.add(pos);

    let counts: VMap<Player, number> = HashMap.empty<Player, number>();
    for (const t of state.getDeployedMeeples()) {
      if (!(t._1 instanceof Follower)) continue;
      if (!positions.contains(t._2.getPosition())) continue;
      const p = t._1.getPlayer();
      counts = counts.put(p, counts.get(p).getOrElse(0) + 1);
    }

    const points: ReceivedPoints[] = [];
    for (const ct of counts) {
      const followers = ct._2;
      const expr = new ExprItem(followers, "meeples", token.points * followers);
      points.push(
        new ReceivedPoints(new PointsExpression("bigtop", expr), ct._1, pos as unknown as BoardPointer),
      );
    }
    if (points.length > 0) {
      state = new AddPoints(List.ofAll(points), false).apply(state);
    }
    return state;
  }

  getUnusedTokens(state: GameState): AnimalToken[] {
    const tokenSetCount = this.getModel(state);
    const placedByPoints = new Map<number, number>();
    for (const ev of state.getEvents()) {
      if (ev instanceof TokenPlacedEvent && ev.getToken() instanceof AnimalToken) {
        const tk = ev.getToken() as AnimalToken;
        placedByPoints.set(tk.points, (placedByPoints.get(tk.points) ?? 0) + 1);
      }
    }
    const unused: AnimalToken[] = [];
    for (const t of AnimalToken.values()) {
      let count = t.count * tokenSetCount;
      count -= placedByPoints.get(t.points) ?? 0;
      for (let i = 0; i < count; i++) unused.push(t);
    }
    return unused;
  }
}

Capability.register(BigTopCapability);
