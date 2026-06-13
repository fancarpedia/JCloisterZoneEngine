import type { Set } from "../../../io/vavr/Set.js";
import type { MeeplePointer } from "../board/pointer/MeeplePointer.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Move the fairy next to one of the player's followers (standard fairy rule). */
export class FairyNextToAction extends AbstractPlayerAction<MeeplePointer> {
  static readonly simpleName = "FairyNextToAction";

  constructor(
    private readonly figureId: string,
    options: Set<MeeplePointer>,
  ) {
    super(options);
  }

  getFigureId(): string {
    return this.figureId;
  }
}
