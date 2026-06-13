import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { Vector } from "../../../../io/vavr/SeqTypes.js";
import type { ClassToken } from "../../../../lang/Class.js";
import type { Player } from "../../Player.js";
import { Location } from "../../board/Location.js";
import type { Position } from "../../board/Position.js";
import type { List } from "../../../../io/vavr/SeqTypes.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { MeepleAction } from "../../action/MeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { City } from "../../feature/City.js";
import { Field } from "../../feature/Field.js";
import type { Feature } from "../../feature/Feature.js";
import { Monastery } from "../../feature/Monastery.js";
import { Quarter } from "../../feature/Quarter.js";
import { Road } from "../../feature/Road.js";
import type { Scoreable } from "../../feature/Scoreable.js";
import type { Meeple } from "../../figure/Meeple.js";
import type { DeployMeepleMessage } from "../../io/message/DeployMeepleMessage.js";
import { DeployMeepleMessage as DeployMeepleMessageClass } from "../../io/message/DeployMeepleMessage.js";
import type { PassMessage } from "../../io/message/PassMessage.js";
import { DeployMeeple } from "../../reducers/DeployMeeple.js";
import { CountCapability } from "../capability/CountCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

/** Shared logic of the two Count district-scoring phases: offer to redeploy a follower from
 *  a just-scored feature onto a district of the City of Carcassonne. */
export abstract class AbstractCocScoringPhase extends Phase {
  protected abstract getAllowedFeaturesFilter(state: GameState): (f: Feature) => boolean;
  protected abstract nextPlayer(state: GameState, player: Player, actionUsed: boolean): StepResult;
  protected abstract getValidQuarters(state: GameState): List<Location>;

  protected endPhase(state: GameState): StepResult {
    state = this.clearActions(state);
    return this.next(state);
  }

  private getFeatureTypeForLocation(loc: Location): ClassToken<Scoreable> {
    if (loc === Location.QUARTER_CASTLE) return City as unknown as ClassToken<Scoreable>;
    if (loc === Location.QUARTER_BLACKSMITH) return Road as unknown as ClassToken<Scoreable>;
    if (loc === Location.QUARTER_CATHEDRAL) return Monastery as unknown as ClassToken<Scoreable>;
    if (loc === Location.QUARTER_MARKET) return Field as unknown as ClassToken<Scoreable>;
    throw new Error("Illegal location " + loc);
  }

  private quarterTilePosition(state: GameState): Position {
    for (const t of state.getPlacedTiles()) {
      if (t._2.getTile().getId() === CountCapability.QUARTER_ACTION_TILE_ID) return t._1;
    }
    throw new Error("CO/7 tile not placed");
  }

  protected processPlayer(state: GameState, player: Player): StepResult | null {
    const countFp = state.getNeutralFigures().getCountDeployment()!;
    const filter = this.getAllowedFeaturesFilter(state);
    const actions: MeepleAction[] = [];

    for (const quarter of this.getValidQuarters(state)) {
      if (quarter === countFp.getLocation()) continue;

      let options: Set<FeaturePointer> = HashSet.empty<FeaturePointer>();
      for (const feat of state.getFeatures(this.getFeatureTypeForLocation(quarter))) {
        if (!filter(feat as unknown as Feature)) continue;
        for (const place of feat.getPlaces()) options = options.add(place);
      }
      options = options.filter((tp) => {
        for (const cap of state.getCapabilities().toSeq()) {
          if (!cap.isMeepleDeploymentAllowed(state, tp.getPosition())) return false;
        }
        return true;
      });
      if (options.isEmpty()) continue;

      const quarterFp = new FeaturePointer(this.quarterTilePosition(state), Quarter as never, quarter);

      // one action per meeple class the player has deployed on this quarter
      const byClass = new Map<unknown, Meeple>();
      for (const t of state.getDeployedMeeples()) {
        if (t._2.getLocation() !== quarter) continue;
        const m = t._1;
        if (!m.getPlayer().equals(player)) continue;
        const cls = m.constructor;
        if (!byClass.has(cls)) byClass.set(cls, m);
      }
      for (const m of byClass.values()) {
        actions.push(new MeepleAction(m, options, quarterFp));
      }
    }

    if (actions.length === 0) return null;

    let as = new ActionsState(player, Vector.ofAll(actions as unknown as PlayerAction<unknown>[]), true);
    as = as.mergeMeepleActions();
    return this.promote(state.setPlayerActions(as));
  }

  handleDeployMeeple(state: GameState, msg: DeployMeepleMessage): StepResult {
    const fp = msg.getPointer()!;
    const player = state.getActivePlayer()!;
    const follower = player.getFollowers(state).find((f) => f.getId() === msg.getMeepleId()).get();
    state = new DeployMeeple(follower, fp).apply(state);
    return this.nextPlayer(state, player, true);
  }

  handlePass(state: GameState, _msg: PassMessage): StepResult {
    const player = state.getActivePlayer()!;
    return this.nextPlayer(state, player, false);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(DeployMeepleMessageClass, this.handleDeployMeeple);
    return m;
  }
}
