import type { Set } from "../../../io/vavr/Set.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";
import type { SelectFeatureAction } from "./SelectFeatureAction.js";

/** Offer to place a bridge token over a field gap on the just-placed tile. */
export class BridgeAction extends AbstractPlayerAction<FeaturePointer> implements SelectFeatureAction {
  static readonly simpleName = "BridgeAction";

  constructor(options: Set<FeaturePointer>) {
    super(options);
  }
}
