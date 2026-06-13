import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { NeutralFigure } from "./NeutralFigure.js";

/** The Witch (Mage &amp; Witch). */
export class Witch extends NeutralFigure<FeaturePointer> {
  static readonly simpleName = "Witch";
  constructor(id: string) {
    super(id);
  }
}
