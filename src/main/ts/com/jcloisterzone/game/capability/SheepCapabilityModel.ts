import type { Map as VMap } from "../../../../io/vavr/Map.js";
import type { List } from "../../../../io/vavr/SeqTypes.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { MeeplePointer } from "../../board/pointer/MeeplePointer.js";
import type { SheepToken } from "./SheepToken.js";

/** Model for SheepCapability: placed sheep tokens per field + flocks awaiting a decision. */
export class SheepCapabilityModel {
  constructor(
    private readonly placedTokens: VMap<FeaturePointer, List<SheepToken>>,
    private readonly unresolvedFlocks: List<MeeplePointer>,
  ) {}

  getPlacedTokens(): VMap<FeaturePointer, List<SheepToken>> {
    return this.placedTokens;
  }
  setPlacedTokens(placedTokens: VMap<FeaturePointer, List<SheepToken>>): SheepCapabilityModel {
    return new SheepCapabilityModel(placedTokens, this.unresolvedFlocks);
  }
  getUnresolvedFlocks(): List<MeeplePointer> {
    return this.unresolvedFlocks;
  }
  setUnresolvedFlocks(unresolvedFlocks: List<MeeplePointer>): SheepCapabilityModel {
    return new SheepCapabilityModel(this.placedTokens, unresolvedFlocks);
  }
}
