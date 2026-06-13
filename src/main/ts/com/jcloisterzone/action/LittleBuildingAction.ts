import type { Set } from "../../../io/vavr/Set.js";
import type { Position } from "../board/Position.js";
import type { LittleBuildingsCapability } from "../game/capability/LittleBuildingsCapability.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Offer to place a little-building token on the just-placed tile. */
export class LittleBuildingAction extends AbstractPlayerAction<LittleBuildingsCapability.LittleBuilding> {
  static readonly simpleName = "LittleBuildingAction";

  constructor(
    options: Set<LittleBuildingsCapability.LittleBuilding>,
    private readonly pos: Position,
  ) {
    super(options);
  }

  getPosition(): Position {
    return this.pos;
  }
}
