import type { Set } from "../../../io/vavr/Set.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";
import type { SelectFeatureAction } from "./SelectFeatureAction.js";

/** Offer to place/move a ferry on one of the candidate road-end pairs (lake ferries). */
export class FerriesAction extends AbstractPlayerAction<FeaturePointer> implements SelectFeatureAction {
  static readonly simpleName = "FerriesAction";

  constructor(options: Set<FeaturePointer>) {
    super(options);
  }
}
