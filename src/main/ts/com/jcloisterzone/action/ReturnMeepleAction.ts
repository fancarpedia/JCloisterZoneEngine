import type { Set } from "../../../io/vavr/Set.js";
import type { MeeplePointer } from "../board/pointer/MeeplePointer.js";
import type { ReturnMeepleSource } from "../game/ReturnMeepleSource.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Offer to return a deployed meeple (e.g. voluntary abbot return to score). */
export class ReturnMeepleAction extends AbstractPlayerAction<MeeplePointer> {
  static readonly simpleName = "ReturnMeepleAction";

  constructor(
    options: Set<MeeplePointer>,
    private readonly returnMeepleSource: ReturnMeepleSource,
  ) {
    super(options);
  }

  getReturnMeepleSource(): ReturnMeepleSource {
    return this.returnMeepleSource;
  }
}
