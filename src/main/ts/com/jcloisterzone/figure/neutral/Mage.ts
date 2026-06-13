import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { NeutralFigure } from "./NeutralFigure.js";

/** The Mage (Mage &amp; Witch). */
export class Mage extends NeutralFigure<FeaturePointer> {
  static readonly simpleName = "Mage";
  constructor(id: string) {
    super(id);
  }
}
