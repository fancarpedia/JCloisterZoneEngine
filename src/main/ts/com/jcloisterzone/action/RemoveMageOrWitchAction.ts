import type { Set } from "../../../io/vavr/Set.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { NeutralFigure } from "../figure/neutral/NeutralFigure.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Offer to remove the mage or witch from the board (when neither can be moved). */
export class RemoveMageOrWitchAction extends AbstractPlayerAction<NeutralFigure<FeaturePointer>> {
  static readonly simpleName = "RemoveMageOrWitchAction";

  constructor(options: Set<NeutralFigure<FeaturePointer>>) {
    super(options);
  }
}
