import type { Set } from "../../../io/vavr/Set.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { ScoreFirstMessage } from "../io/message/ScoreFirstMessage.js";
import type { ReplayableMessage } from "../io/message/ReplayableMessage.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";
import type { SelectFeatureAction } from "./SelectFeatureAction.js";

/** Offer the turn player the completed features whose scoring order matters; one is scored first. */
export class ScoreFirstAction extends AbstractPlayerAction<FeaturePointer> implements SelectFeatureAction {
  static readonly simpleName = "ScoreFirstAction";

  constructor(options: Set<FeaturePointer>) {
    super(options);
  }

  // Overridden on purpose: the AI plays any action by mapping its options through select(),
  // and the base class returns null - an AI facing this choice would otherwise send nothing.
  override select(option: FeaturePointer): ReplayableMessage {
    return new ScoreFirstMessage(option);
  }
}
