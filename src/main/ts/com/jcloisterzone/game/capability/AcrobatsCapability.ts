import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { List } from "../../../../io/vavr/SeqTypes.js";
import type { Position } from "../../board/Position.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { Acrobats } from "../../feature/Acrobats.js";
import { SmallFollower } from "../../figure/SmallFollower.js";
import { MeepleAction } from "../../action/MeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { ScoreAcrobatsAction } from "../../action/ScoreAcrobatsAction.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import { UndeployMeeples } from "../../reducers/UndeployMeeples.js";
import { Capability } from "../Capability.js";
import { BridgeCapability } from "./BridgeCapability.js";
import { PortalCapability } from "./PortalCapability.js";
import type { GameState } from "../state/GameState.js";

const FULL_ACROBATS = 3;

/** Acrobats spaces (Under the Big Top): up to 3 followers can pile on; a full pile scores
 *  5 points each and is returned; unfinished piles score at game end. */
export class AcrobatsCapability extends Capability<void> {
  override onActionPhaseEntered(state: GameState): GameState {
    let actions = state.getPlayerActions();
    if (actions === null) return state;
    const original = actions;
    const active = state.getActivePlayer()!;
    const currentTilePos = state.getLastPlaced()!.getPosition();

    const meeple = active.getMeepleFromSupply(state, SmallFollower) as SmallFollower | null;

    // not allowed to place an acrobat on a tile holding a bridge
    let placedBridges: Set<Position> = HashSet.empty<Position>();
    if (state.hasCapability(BridgeCapability as never)) {
      placedBridges = state
        .getCapabilityModel<Set<FeaturePointer>>(BridgeCapability as never)
        .map((fp) => fp.getPosition());
    }
    // With a Magic Portal, an acrobat may also be placed onto any acrobats space.
    const hasMagicPortal = state.getLastPlaced()!.getTile().hasModifier(PortalCapability.MAGIC_PORTAL);

    let acrobatsToScore: Set<FeaturePointer> = HashSet.empty<FeaturePointer>();
    for (const feature of state.getFeatures(Acrobats)) {
      const meeplesCount = feature.getMeeples(state).length();
      const fp = feature.getPlace();
      if (placedBridges.contains(fp.getPosition())) continue;

      if (meeplesCount >= FULL_ACROBATS) {
        acrobatsToScore = acrobatsToScore.add(fp);
        continue;
      }
      if (meeple !== null) {
        const pos = fp.getPosition();
        const canPlace =
          hasMagicPortal ||
          (Math.abs(currentTilePos.x - pos.x) <= 1 && Math.abs(currentTilePos.y - pos.y) <= 1);
        if (canPlace) {
          actions = actions.appendAction(
            new MeepleAction(meeple, HashSet.of(fp)) as unknown as PlayerAction<unknown>,
          );
        }
      }
    }

    if (!acrobatsToScore.isEmpty()) {
      actions = actions.appendAction(new ScoreAcrobatsAction(acrobatsToScore) as unknown as PlayerAction<unknown>);
    }

    if (original !== actions) {
      state = state.setPlayerActions(actions.mergeMeepleActions());
    }
    return state;
  }

  override onFinalScoring(state: GameState): GameState {
    for (const acrobats of state.getFeatures(Acrobats)) {
      if (acrobats.isOccupied(state)) {
        state = this.scoreAcrobats(state, acrobats, false);
      }
    }
    return state;
  }

  scoreAcrobats(state: GameState, acrobats: Acrobats, undeployMeeples: boolean): GameState {
    const points: ReceivedPoints[] = [];
    for (const t of acrobats.getMeeples(state).groupBy((m) => m.getPlayer())) {
      const meepleCount = t._2.size();
      const expr = new ExprItem(meepleCount, "meeples", 5 * meepleCount);
      points.push(
        new ReceivedPoints(new PointsExpression("acrobats", expr), t._1, acrobats.getPlace().getPosition()),
      );
    }
    state = new AddPoints(List.ofAll(points), false).apply(state);
    if (undeployMeeples) {
      state = new UndeployMeeples(acrobats as unknown as import("../../feature/Feature.js").Feature, false).apply(state);
    }
    return state;
  }
}

Capability.register(AcrobatsCapability);
