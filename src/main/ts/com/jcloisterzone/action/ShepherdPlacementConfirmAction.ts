import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Confirms placement of a just-deployed shepherd. */
export class ShepherdPlacementConfirmAction extends AbstractPlayerAction<void> {
  static readonly simpleName = "ShepherdPlacementConfirmAction";

  constructor() {
    super(null);
  }
}
