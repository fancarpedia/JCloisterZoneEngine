import { HashSet, type Set } from "../../../io/vavr/Set.js";
import { Stream } from "../../../io/vavr/SeqTypes.js";
import type { Player } from "../Player.js";
import { Position } from "../board/Position.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { Field } from "../feature/Field.js";
import type { Structure } from "../feature/Structure.js";
import type { GameState } from "../game/state/GameState.js";
import type { PlacedTile } from "../game/state/PlacedTile.js";
import { DeploymentCheckResult } from "./DeploymentCheckResult.js";
import { Special } from "./Special.js";

/** The Windmill (mini-expansion) — on a field; scores 1 pt per tile in its 3×3-cross
 *  range (9 tiles full, or whatever's present at game end). */
import type { UnaffectedByBarn } from "../game/capability/trait/UnaffectedByBarn.js";

import type { FlowersBonusAffected } from "../game/capability/trait/FlowersBonusAffected.js";

export class Windmill extends Special implements UnaffectedByBarn, FlowersBonusAffected {
  isFlowersBonusAffected(): true {
    return true;
  }

  static readonly simpleName = "Windmill";
  isUnaffectedByBarn(): true {
    return true;
  }

  static readonly RANGE_POSITIONS: Set<Position> = HashSet.of(
    new Position(-2, 0),
    new Position(-1, 0),
    new Position(0, 0),
    new Position(1, 0),
    new Position(2, 0),
    new Position(0, -2),
    new Position(0, -1),
    new Position(0, 1),
    new Position(0, 2),
  );

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
      return new DeploymentCheckResult("The windmill must be placed only on a field.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }

  getRangeTiles(state: GameState): Stream<PlacedTile> {
    const origin = this.getPosition(state)!;
    const tiles: PlacedTile[] = [];
    for (const offset of Windmill.RANGE_POSITIONS) {
      const t = state.getPlacedTile(origin.add(offset));
      if (t !== null) tiles.push(t);
    }
    return Stream.ofAll(tiles);
  }
}
