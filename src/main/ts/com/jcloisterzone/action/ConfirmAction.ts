import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** A simple confirm/commit action (no options). */
export class ConfirmAction extends AbstractPlayerAction<void> {
  constructor() {
    super(null);
  }
}
