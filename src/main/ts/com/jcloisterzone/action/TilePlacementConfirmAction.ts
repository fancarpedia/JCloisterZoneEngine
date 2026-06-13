import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Confirm a tile placement (Meteorites) — the crater tile must be confirmed before the
 *  meteorite-impact die is rolled. Field-less. */
export class TilePlacementConfirmAction extends AbstractPlayerAction<void> {
  static readonly simpleName = "TilePlacementConfirmAction";

  constructor() {
    super(null);
  }
}
