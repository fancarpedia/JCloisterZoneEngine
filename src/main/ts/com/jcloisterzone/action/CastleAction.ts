import type { Set } from "../../../io/vavr/Set.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";
import type { SelectFeatureAction } from "./SelectFeatureAction.js";

/** Offer to convert a just-completed-eligible 2-tile city into a castle. */
export class CastleAction extends AbstractPlayerAction<FeaturePointer> implements SelectFeatureAction {
  static readonly simpleName = "CastleAction";

  constructor(options: Set<FeaturePointer>) {
    super(options);
  }
}
