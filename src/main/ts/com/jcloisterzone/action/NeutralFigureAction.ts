import type { Set } from "../../../io/vavr/Set.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { NeutralFigure } from "../figure/neutral/NeutralFigure.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";
import type { SelectFeatureAction } from "./SelectFeatureAction.js";

/** Offer to move a neutral figure (mage/witch) onto one of the option features. */
export class NeutralFigureAction
  extends AbstractPlayerAction<FeaturePointer>
  implements SelectFeatureAction
{
  static readonly simpleName = "NeutralFigureAction";

  private readonly figure: NeutralFigure<FeaturePointer>;

  constructor(figure: NeutralFigure<FeaturePointer>, options: Set<FeaturePointer>) {
    super(options);
    this.figure = figure;
  }

  getFigure(): NeutralFigure<FeaturePointer> {
    return this.figure;
  }
}
