import type { MeeplePointer } from "../board/pointer/MeeplePointer.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Prompts the shepherd owner to expand or score the flock. */
export class FlockAction extends AbstractPlayerAction<void> {
  static readonly simpleName = "FlockAction";

  constructor(private readonly shepherdPointer: MeeplePointer) {
    super(null);
  }

  getShepherdPointer(): MeeplePointer {
    return this.shepherdPointer;
  }
}
