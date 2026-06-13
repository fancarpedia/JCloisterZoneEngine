import { List, Arr, Vector } from "../../../../io/vavr/SeqTypes.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { JavaEnum } from "../../../../lang/JavaEnum.js";
import type { ClassToken } from "../../../../lang/Class.js";
import type { Position } from "../../board/Position.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { Tower } from "../../feature/Tower.js";
import { BigFollower } from "../../figure/BigFollower.js";
import { Follower } from "../../figure/Follower.js";
import type { Meeple } from "../../figure/Meeple.js";
import { Phantom } from "../../figure/Phantom.js";
import { Ringmaster } from "../../figure/Ringmaster.js";
import { SmallFollower } from "../../figure/SmallFollower.js";
import { MeepleAction } from "../../action/MeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { TowerPieceAction } from "../../action/TowerPieceAction.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { BlackTowerCapability } from "./BlackTowerCapability.js";
import { Capability } from "../Capability.js";
import type { Token } from "../Token.js";
import type { GameState } from "../state/GameState.js";

/** The Tower expansion. Model: per-player list of captured followers. */
export class TowerCapability extends Capability<Arr<List<Follower>>> {
  static readonly RANSOM_POINTS = 3;

  private getInitialPiecesCount(state: GameState): number[] {
    switch (state.getPlayers().getPlayers().length()) {
      case 1:
      case 2:
        return [10, 8, 4, 2];
      case 3:
        return [9, 7, 3, 2];
      case 4:
        return [7, 6, 3, 1];
      case 5:
        return [6, 5, 2, 1];
      case 6:
        return [5, 4, 2, 1];
      case 7:
        return [4, 3, 2, 1];
      default:
        return [3, 2, 1, 1];
    }
  }

  override onStartGame(state: GameState, random: RandomGenerator): GameState {
    const pieces = this.getInitialPiecesCount(state);
    const T = TowerCapability.TowerToken;
    if (state.hasCapability(BlackTowerCapability)) {
      state = state.mapPlayers((ps) => ps.setTokenCountForAllPlayers(T.TOWER_PIECE, pieces[1]));
      state = state.mapPlayers((ps) => ps.setTokenCountForAllPlayers(T.BLACK_TOWER_PIECE, pieces[2]));
      state = state.mapPlayers((ps) => ps.setTokenCountForAllPlayers(T.WHITE_TOWER_PIECE, pieces[3]));
    } else {
      state = state.mapPlayers((ps) => ps.setTokenCountForAllPlayers(T.TOWER_PIECE, pieces[0]));
    }
    return this.setModel(state, Arr.fill(state.getPlayers().length(), () => List.empty<Follower>()));
  }

  override onActionPhaseEntered(state: GameState): GameState {
    let as = state.getPlayerActions()!;
    const player = as.getPlayer();
    const T = TowerCapability.TowerToken;

    // fps occupied by a deployed meeple sitting on a Tower
    const occupiedFps: FeaturePointer[] = [];
    for (const t of state.getDeployedMeeples()) {
      if (t._2.getFeature() === (Tower as unknown as ClassToken)) occupiedFps.push(t._2);
    }

    const pieceFps: FeaturePointer[] = []; // towers a piece may be placed on
    const followerFps: FeaturePointer[] = []; // towers a follower may be deployed on
    for (const tower of state.getFeatures(Tower)) {
      const places = tower.getPlaces().toArray();
      if (places.some((pl) => occupiedFps.some((of) => of.equals(pl)))) continue;
      if (tower.matchLastPiece(T.WHITE_TOWER_PIECE)) continue;
      const place = tower.getPlace();
      pieceFps.push(place);
      if (tower.getPieces().size() > 0) followerFps.push(place);
    }

    if (pieceFps.length > 0) {
      const positions: Set<Position> = HashSet.ofAll(pieceFps.map((fp) => fp.getPosition()));
      if (state.getPlayers().getPlayerTokenCount(player.getIndex(), T.TOWER_PIECE) > 0) {
        as = as.appendAction(new TowerPieceAction(positions, T.TOWER_PIECE) as unknown as PlayerAction<unknown>);
      }
      if (state.getPlayers().getPlayerTokenCount(player.getIndex(), T.BLACK_TOWER_PIECE) > 0) {
        as = as.appendAction(new TowerPieceAction(positions, T.BLACK_TOWER_PIECE) as unknown as PlayerAction<unknown>);
      }
    }

    if (followerFps.length > 0) {
      const followerOptions: Set<FeaturePointer> = HashSet.ofAll(followerFps);
      const availMeeples = player.getMeeplesFromSupply(
        state,
        Vector.ofAll([SmallFollower, BigFollower, Phantom, Ringmaster] as unknown as ClassToken<Meeple>[]),
      );
      const meepleActions = availMeeples.map(
        (meeple) => new MeepleAction(meeple, followerOptions) as unknown as PlayerAction<unknown>,
      );
      as = as.appendActions(meepleActions).mergeMeepleActions();
      if (state.getPlayers().getPlayerTokenCount(player.getIndex(), T.WHITE_TOWER_PIECE) > 0) {
        const wpos: Set<Position> = HashSet.ofAll(followerFps.map((fp) => fp.getPosition()));
        as = as.appendAction(new TowerPieceAction(wpos, T.WHITE_TOWER_PIECE) as unknown as PlayerAction<unknown>);
      }
    }

    return state.setPlayerActions(as);
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TowerCapability {
  export class TowerToken extends JavaEnum implements Token {
    static readonly TOWER_PIECE = new TowerToken("TOWER_PIECE", 0);
    static readonly BLACK_TOWER_PIECE = new TowerToken("BLACK_TOWER_PIECE", 1);
    static readonly WHITE_TOWER_PIECE = new TowerToken("WHITE_TOWER_PIECE", 2);
    private static readonly VALUES: readonly TowerToken[] = [
      TowerToken.TOWER_PIECE,
      TowerToken.BLACK_TOWER_PIECE,
      TowerToken.WHITE_TOWER_PIECE,
    ];
    static values(): readonly TowerToken[] {
      return TowerToken.VALUES;
    }
    static valueOf(name: string): TowerToken {
      const v = TowerToken.VALUES.find((t) => t.name() === name);
      if (v === undefined) throw new Error("No TowerToken " + name);
      return v;
    }
  }
}

Capability.register(TowerCapability);
