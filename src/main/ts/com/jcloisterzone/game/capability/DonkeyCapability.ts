import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { PlacementOption } from "../../board/PlacementOption.js";
import { Position } from "../../board/Position.js";
import type { Tile } from "../../board/Tile.js";
import { City } from "../../feature/City.js";
import { type Completable, isInstanceOfCompletable } from "../../feature/Completable.js";
import { Garden } from "../../feature/Garden.js";
import { Monastery } from "../../feature/Monastery.js";
import { River } from "../../feature/River.js";
import { Road } from "../../feature/Road.js";
import { Donkey } from "../../figure/neutral/Donkey.js";
import type { NeutralFigure } from "../../figure/neutral/NeutralFigure.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { MoveNeutralFigure } from "../../reducers/MoveNeutralFigure.js";
import { PlaceTile } from "../../reducers/PlaceTile.js";
import { DonkeyAction } from "../../action/DonkeyAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";


/** Donkey (Village Life) — a neutral figure that blocks completion of the feature(s)
 *  it sits on: a tile placement that would complete such a feature is forbidden. */
export class DonkeyCapability extends Capability<void> {
  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    state = state.setNeutralFigures(state.getNeutralFigures().setDonkey(new Donkey("donkey.1")));
    return new MoveNeutralFigure(
      state.getNeutralFigures().getDonkey() as unknown as NeutralFigure<BoardPointer>,
      new Position(0, 0),
    ).apply(state);
  }

  override isTilePlacementAllowed(state: GameState, tile: Tile, placement: PlacementOption): boolean {
    const donkeyPtr = state.getNeutralFigures().getDonkeyDeployment();
    if (donkeyPtr === null) return true;
    const completedBefore = this.getCompletedTileFeatures(state, donkeyPtr);
    const placed = new PlaceTile(tile, placement.getPosition(), placement.getRotation()).apply(state);
    const completedAfter = this.getCompletedTileFeatures(placed, donkeyPtr);
    return completedBefore === completedAfter;
  }

  override onActionPhaseEntered(state: GameState): GameState {
    const donkey = state.getNeutralFigures().getDonkey();
    if (donkey === null) return state;
    const donkeyPos = state.getNeutralFigures().getDonkeyDeployment();
    let positions: Set<Position> = HashSet.ofAll(state.getPlacedTiles().keySet());
    if (donkeyPos !== null) positions = positions.filter((p) => !p.equals(donkeyPos));
    if (positions.isEmpty()) return state;
    return state.appendAction(new DonkeyAction(donkey.getId(), positions) as unknown as PlayerAction<unknown>);
  }

  /** FeatureCompletionBlocker: a completed feature the donkey sits on is blocked
   *  (e.g. a road completed by a tunnel join doesn't score while the donkey is on it). */
  isFeatureCompletionBlocked(state: GameState, fp: FeaturePointer): boolean {
    const f = state.getFeature(fp);
    if (f === null || !isInstanceOfCompletable(f) || !(f as unknown as Completable).isCompleted(state)) return false;
    const fishermen = Capability.tryClassForName("Fishermen");
    const hasFishermen = fishermen !== null && state.hasCapability(fishermen);
    if (f instanceof River && !hasFishermen) return false;
    const donkeyPos = state.getNeutralFigures().getDonkeyDeployment();
    return donkeyPos !== null && (f as unknown as Completable).getTilePositions().contains(donkeyPos);
  }

  /** Number of completed features on the donkey's tile (river only counts with Fishermen). */
  private getCompletedTileFeatures(state: GameState, pos: Position): number {
    const fishermen = Capability.tryClassForName("Fishermen");
    const hasFishermen = fishermen !== null && state.hasCapability(fishermen);
    let completed = 0;
    for (const t of state.getTileFeatures2(pos)) {
      const f = t._2;
      if (!isInstanceOfCompletable(f) || !(f as unknown as Completable).isCompleted(state)) continue;
      if (!(f instanceof River) || hasFishermen) completed++;
    }
    return completed;
  }
}

Capability.register(DonkeyCapability);
