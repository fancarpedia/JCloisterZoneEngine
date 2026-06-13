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
import type { TopLeftTranslatedFigurePosition } from "./TopLeftTranslatedFigurePosition.js";

/** The Obelisk (Obelisk mini-expansion) — deployed on a field intersection; at end
 *  of game (or once its 4×4 range is full) scores 1 point per tile in range. */
import type { UnaffectedByBarn } from "../game/capability/trait/UnaffectedByBarn.js";

import type { FlowersBonusAffected } from "../game/capability/trait/FlowersBonusAffected.js";

export class Obelisk extends Special implements TopLeftTranslatedFigurePosition, UnaffectedByBarn, FlowersBonusAffected {
  isFlowersBonusAffected(): true {
    return true;
  }

  static readonly simpleName = "Obelisk";
  isUnaffectedByBarn(): true {
    return true;
  }
  readonly topLeftTranslated = true as const;

  /** The 4×4 grid of tile offsets the obelisk scores over (top-left corner anchor). */
  static readonly RANGE_POSITIONS: Set<Position> = HashSet.of(
    new Position(-2, -2),
    new Position(-2, -1),
    new Position(-2, 0),
    new Position(-2, 1),
    new Position(-1, -2),
    new Position(-1, -1),
    new Position(-1, 0),
    new Position(-1, 1),
    new Position(0, -2),
    new Position(0, -1),
    new Position(0, 0),
    new Position(0, 1),
    new Position(1, -2),
    new Position(1, -1),
    new Position(1, 0),
    new Position(1, 1),
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
      return new DeploymentCheckResult("The obelisk must be placed only on a field.");
    }
    return super.isDeploymentAllowed(state, fp, feature);
  }

  getRangeTiles(state: GameState): Stream<PlacedTile> {
    const origin = this.getPosition(state)!;
    const tiles: PlacedTile[] = [];
    for (const offset of Obelisk.RANGE_POSITIONS) {
      const t = state.getPlacedTile(origin.add(offset));
      if (t !== null) tiles.push(t);
    }
    return Stream.ofAll(tiles);
  }
}
