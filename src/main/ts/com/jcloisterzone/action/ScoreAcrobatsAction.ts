import type { Set } from "../../../io/vavr/Set.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";
import type { SelectFeatureAction } from "./SelectFeatureAction.js";

/** Offer to score a full (3-meeple) acrobats space (Under the Big Top). */
export class ScoreAcrobatsAction extends AbstractPlayerAction<FeaturePointer> implements SelectFeatureAction {
  static readonly simpleName = "ScoreAcrobatsAction";

  constructor(options: Set<FeaturePointer>) {
    super(options);
  }
}
