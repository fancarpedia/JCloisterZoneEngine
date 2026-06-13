import { Stream } from "../../../io/vavr/SeqTypes.js";
import type { Player } from "../Player.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { Field } from "../feature/Field.js";
import type { Structure } from "../feature/Structure.js";
import type { GameState } from "../game/state/GameState.js";
import type { PlacedTile } from "../game/state/PlacedTile.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Special } from "./Special.js";

/** Děčínský Sněžník (mini-expansion) — on a field; scores 1 pt per tile in its
 *  range (the deployed tile + its 4 orthogonal neighbours; 5 full). */
import type { UnaffectedByBarn } from "../game/capability/trait/UnaffectedByBarn.js";

import type { FlowersBonusAffected } from "../game/capability/trait/FlowersBonusAffected.js";

export class DecinskySneznik extends Special implements UnaffectedByBarn, FlowersBonusAffected {
  isFlowersBonusAffected(): true {
    return true;
  }

  static readonly simpleName = "DecinskySneznik";
  isUnaffectedByBarn(): true {
    return true;
  }

  constructor(id: string, player: Player) {
    super(id, player);
  }

  override canBeEatenByDragon(_state: GameState): boolean {
    return false;
  }

  override interactingWithOtherMeeples(): boolean {
    return false;
  }

  override isDeploymentAllowed(state: GameState, fp: FeaturePointer, feature: Structure): DeploymentCheckResult {
    if (!(feature instanceof Field)) {
      return new DeploymentCheckResult("The Decinsky Sneznik must be placed only on a field.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }

  getRangeTiles(state: GameState): Stream<PlacedTile> {
    const pos = this.getPosition(state)!;
    const tiles: PlacedTile[] = state
      .getAdjacentTiles2(pos)
      .map((t) => t._2)
      .toArray();
    const self = state.getPlacedTile(pos);
    if (self !== null) tiles.push(self);
    return Stream.ofAll(tiles);
  }
}
