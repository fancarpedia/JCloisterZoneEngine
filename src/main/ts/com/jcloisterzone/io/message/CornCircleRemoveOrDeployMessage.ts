import { AbstractMessage } from "./AbstractMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** CIRCLE_REMOVE_OR_DEPLOY — the active player's choice for the just-placed corn circle. */
export class CornCircleRemoveOrDeployMessage extends AbstractMessage implements ReplayableMessage {
  static readonly command = "CIRCLE_REMOVE_OR_DEPLOY";

  constructor(private readonly value: CornCircleRemoveOrDeployMessage.CornCircleOption) {
    super();
  }

  getValue(): CornCircleRemoveOrDeployMessage.CornCircleOption {
    return this.value;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CornCircleRemoveOrDeployMessage {
  export type CornCircleOption = "DEPLOY" | "REMOVE";
}
