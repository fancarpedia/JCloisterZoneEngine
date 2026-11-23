import type { Set } from "../../../io/vavr/Set.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { BardsLuteCapability } from "../game/capability/BardsLuteCapability.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";
import type { SelectFeatureAction } from "./SelectFeatureAction.js";

/** Offer to place a Bards' note on one free city / road / field of the lute tile just placed. */
export class BardsLuteAction extends AbstractPlayerAction<FeaturePointer> implements SelectFeatureAction {
  static readonly simpleName = "BardsLuteAction";

  constructor(
    options: Set<FeaturePointer>,
    private readonly token: BardsLuteCapability.BardsLuteToken,
  ) {
    super(options);
  }

  getToken(): BardsLuteCapability.BardsLuteToken {
    return this.token;
  }
}
