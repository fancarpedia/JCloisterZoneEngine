import type { Set } from "../../../io/vavr/Set.js";
import type { Follower } from "../figure/Follower.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Rare Tower case: when an opponent has captured followers of more than one type, the
 *  capturing player chooses which prisoner is returned in the exchange. */
export class SelectPrisonerToExchangeAction extends AbstractPlayerAction<Follower> {
  static readonly simpleName = "SelectPrisonerToExchangeAction";

  constructor(
    private readonly justCapturedFollower: Follower,
    options: Set<Follower>,
  ) {
    super(options);
  }

  getJustCapturedFollower(): Follower {
    return this.justCapturedFollower;
  }
}
