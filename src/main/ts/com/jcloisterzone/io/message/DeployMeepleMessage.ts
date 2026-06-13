import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { AbstractMessage } from "./AbstractMessage.js";
import type { RandomChangingMessage } from "./RandomChangingMessage.js";
import type { ReplayableMessage } from "./ReplayableMessage.js";

/** DEPLOY_MEEPLE — place a meeple on a feature pointer. */
export class DeployMeepleMessage
  extends AbstractMessage
  implements ReplayableMessage, RandomChangingMessage
{
  static readonly command = "DEPLOY_MEEPLE";

  private pointer: FeaturePointer | null;
  private meepleId: string | null;
  private random: number | null; // set only for FLYING_MACHINE

  constructor(pointer: FeaturePointer | null = null, meepleId: string | null = null, random: number | null = null) {
    super();
    this.pointer = pointer;
    this.meepleId = meepleId;
    this.random = random;
  }

  getPointer(): FeaturePointer | null {
    return this.pointer;
  }
  setPointer(pointer: FeaturePointer | null): void {
    this.pointer = pointer;
  }
  getMeepleId(): string | null {
    return this.meepleId;
  }
  setMeepleId(meepleId: string | null): void {
    this.meepleId = meepleId;
  }
  getRandom(): number | null {
    return this.random;
  }
  setRandom(random: number | null): void {
    this.random = random;
  }
}
