import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { PlayerAction } from "./PlayerAction.js";

/** A player action whose options are feature pointers. */
export interface SelectFeatureAction extends PlayerAction<FeaturePointer> {}
