import type { Edge } from "../board/Edge.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Feature } from "./Feature.js";

/** A feature lying on a tile edge; triggers edge close / merge on tile placement. */
export interface EdgeFeature extends Feature {
  closeEdge(edge: Edge): EdgeFeature;
  /** default: mergeable with same concrete class. */
  isMergeableWith(other: EdgeFeature): boolean;
  /** default: null. */
  getProxyTarget(): FeaturePointer | null;
}

/** Runtime mirror of Java's `instanceof EdgeFeature` (duck-typed on closeEdge).
 *  THE single definition. */
export function isInstanceOfEdgeFeature(f: unknown): f is EdgeFeature {
  return typeof (f as { closeEdge?: unknown } | null)?.closeEdge === "function";
}
