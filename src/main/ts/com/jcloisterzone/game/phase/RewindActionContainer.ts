import type { Phase } from "./Phase.js";

/**
 * Holds references to the ActionPhase and PhantomPhase so that a Tower "random pay"
 * (PAY_RANSOM) performed after the wood action — but before it has been confirmed or a
 * post-wood follow-up has begun — can rewind the turn back to those phases.
 */
export class RewindActionContainer {
  private actionPhase: Phase | null;
  private phantomPhase: Phase | null;

  constructor(actionPhase: Phase | null = null, phantomPhase: Phase | null = null) {
    this.actionPhase = actionPhase;
    this.phantomPhase = phantomPhase;
  }

  setActionPhase(actionPhase: Phase | null): RewindActionContainer {
    this.actionPhase = actionPhase;
    return this;
  }

  getActionPhase(): Phase | null {
    return this.actionPhase;
  }

  setPhantomPhase(phantomPhase: Phase | null): RewindActionContainer {
    this.phantomPhase = phantomPhase;
    return this;
  }

  getPhantomPhase(): Phase | null {
    return this.phantomPhase;
  }
}
