import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { MeeplePointer } from "../board/pointer/MeeplePointer.js";
import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import type { Structure } from "../feature/Structure.js";
import type { GameState } from "../game/state/GameState.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Figure } from "./Figure.js";

/** A meeple — a figure belonging to a player, deployed onto features. */
export abstract class Meeple extends Figure<FeaturePointer> {
  private readonly player: Player;

  constructor(id: string, player: Player) {
    super(id);
    this.player = player;
  }

  getDeployment(state: GameState): FeaturePointer | null {
    return state.getDeployedMeeples().get(this).getOrNull();
  }

  // Runtime brands used instead of `instanceof Follower/Special` so the feature
  // spine need not import the figure classes as values (breaks an ESM init cycle).
  isFollower(): boolean {
    return false;
  }
  isSpecial(): boolean {
    return false;
  }

  atStructure(state: GameState, feature: Structure): boolean {
    return feature.getMeeples(state).find((m) => m === this).isDefined();
  }

  override at(state: GameState, target: BoardPointer | Structure): boolean {
    if (target instanceof MeeplePointer) {
      if (!this.at(state, target.asFeaturePointer())) return false;
      if (target.getMeepleId() === null || target.getMeepleId() !== this.getId()) return false;
      return true;
    }
    return super.at(state, target);
  }

  canBeEatenByDragon(state: GameState): boolean {
    return true;
  }

  interactingWithOtherMeeples(): boolean {
    return true;
  }

  isDeploymentAllowed(state: GameState, fp: FeaturePointer, feature: Structure): DeploymentCheckResult {
    return DeploymentCheckResult.OK;
  }

  getPlayer(): Player {
    return this.player;
  }
}
