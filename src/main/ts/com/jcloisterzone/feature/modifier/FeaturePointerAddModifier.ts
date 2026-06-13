import { Stream } from "../../../../io/vavr/SeqTypes.js";
import { type ClassToken } from "../../../../lang/Class.js";
import { Location } from "../../board/Location.js";
import { Position } from "../../board/Position.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { Feature } from "../Feature.js";
import type { SetupQuery } from "../../game/setup/SetupQuery.js";
import { FeatureModifier } from "./FeatureModifier.js";

/** Modifier accumulating feature pointers (e.g. gamblers-luck shields). */
export class FeaturePointerAddModifier<F extends Feature> extends FeatureModifier<
  Stream<FeaturePointer>
> {
  private readonly featureClass: ClassToken<F>;

  constructor(selector: string, enabledBy: SetupQuery | null, featureClass: ClassToken<F>) {
    super(selector, enabledBy);
    this.featureClass = featureClass;
  }

  mergeValues(a: Stream<FeaturePointer>, b: Stream<FeaturePointer>): Stream<FeaturePointer> {
    if (a === null) return b;
    if (b === null) return a;
    return a.appendAll(b) as Stream<FeaturePointer>;
  }

  valueOf(attr: string): Stream<FeaturePointer> {
    const locations = attr.trim().split(/\s+/);
    return Stream.ofAll(
      locations.map((s) => new FeaturePointer(Position.ZERO, this.featureClass, Location.valueOf(s))),
    );
  }
}
