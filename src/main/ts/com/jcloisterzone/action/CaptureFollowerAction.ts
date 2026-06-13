import type { Set } from "../../../io/vavr/Set.js";
import type { MeeplePointer } from "../board/pointer/MeeplePointer.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Offer to capture one of the followers within a freshly-raised tower's range. */
export class CaptureFollowerAction extends AbstractPlayerAction<MeeplePointer> {
  static readonly simpleName = "CaptureFollowerAction";

  constructor(options: Set<MeeplePointer>) {
    super(options);
  }
}
