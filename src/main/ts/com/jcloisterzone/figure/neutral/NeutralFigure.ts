import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import type { Structure } from "../../feature/Structure.js";
import type { GameState } from "../../game/state/GameState.js";
import { Figure } from "../Figure.js";

/** Base for neutral (non-player) figures: dragon, fairy, mage, witch, count, ... */
export class NeutralFigure<T extends BoardPointer> extends Figure<T> {
  constructor(id: string) {
    super(id);
  }

  getDeployment(state: GameState): T | null {
    return (
      (state.getNeutralFigures().getDeployedNeutralFigures().get(this).getOrNull() as T | null) ??
      null
    );
  }

  atStructure(state: GameState, feature: Structure): boolean {
    const ptr = this.getDeployment(state);
    if (ptr === null) {
      return false;
    }
    const fp = ptr.asFeaturePointer();
    return feature.getPlaces().contains(fp);
  }
}
