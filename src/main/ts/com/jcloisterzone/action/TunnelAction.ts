import type { Set } from "../../../io/vavr/Set.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { TunnelCapability } from "../game/capability/TunnelCapability.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";
import type { SelectFeatureAction } from "./SelectFeatureAction.js";

/** Offer to place a tunnel token (of a given colour) on an open tunnel end. */
export class TunnelAction extends AbstractPlayerAction<FeaturePointer> implements SelectFeatureAction {
  static readonly simpleName = "TunnelAction";

  constructor(
    options: Set<FeaturePointer>,
    private readonly token: TunnelCapability.Tunnel,
  ) {
    super(options);
  }

  getToken(): TunnelCapability.Tunnel {
    return this.token;
  }
}
