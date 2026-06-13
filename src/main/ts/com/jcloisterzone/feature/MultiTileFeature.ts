import type { EdgeFeature } from "./EdgeFeature.js";

/** An edge feature spanning multiple tiles (mergeable). */
export interface MultiTileFeature extends EdgeFeature {
  merge(f: MultiTileFeature): MultiTileFeature;
}
