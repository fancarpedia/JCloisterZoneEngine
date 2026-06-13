import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { MeteoriteProtected } from "../../game/capability/trait/MeteoriteProtected.js";
import { NeutralFigure } from "./NeutralFigure.js";

/** The Count of Carcassonne. */
export class Count extends NeutralFigure<FeaturePointer> implements MeteoriteProtected {
  static readonly simpleName = "Count";
  readonly meteoriteProtected = true as const;
  constructor(id: string) {
    super(id);
  }
}
