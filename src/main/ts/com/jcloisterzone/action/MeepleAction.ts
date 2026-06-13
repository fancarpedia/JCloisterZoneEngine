import { Tuple2 } from "../../../io/vavr/Tuple.js";
import { HashMap, type Map as VMap } from "../../../io/vavr/Map.js";
import { HashSet, type Set } from "../../../io/vavr/Set.js";
import type { ClassToken } from "../../../lang/Class.js";
import type { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Meeple } from "../figure/Meeple.js";
import { DeployMeepleMessage } from "../io/message/DeployMeepleMessage.js";
import type { ReplayableMessage } from "../io/message/ReplayableMessage.js";
import type { SelectFeatureAction } from "./SelectFeatureAction.js";

type Options = VMap<string, Set<FeaturePointer>>;

/** Action to deploy a meeple onto one of a set of feature pointers. */
export class MeepleAction implements SelectFeatureAction {
  private readonly options: Options;
  private readonly meepleType: ClassToken<Meeple>;
  private readonly origin: FeaturePointer | null;

  constructor(meeple: Meeple, options: Set<FeaturePointer>, origin?: FeaturePointer | null);
  constructor(meepleType: ClassToken<Meeple>, options: Options, origin: FeaturePointer | null);
  constructor(
    a: Meeple | ClassToken<Meeple>,
    options: Set<FeaturePointer> | Options,
    origin: FeaturePointer | null = null,
  ) {
    if (typeof a === "function") {
      this.meepleType = a;
      this.options = options as Options;
      this.origin = origin;
    } else {
      this.meepleType = (a as object).constructor as ClassToken<Meeple>;
      this.options = HashMap.of(a.getId(), options as Set<FeaturePointer>);
      this.origin = origin;
    }
  }

  getMeepleType(): ClassToken<Meeple> {
    return this.meepleType;
  }

  getOrigin(): FeaturePointer | null {
    return this.origin;
  }

  isCityOfCarcassoneMove(): boolean {
    return this.origin !== null && this.origin.getLocation()!.isCityOfCarcassonneQuarter();
  }

  getMeepleIdFor(fp: FeaturePointer): string {
    return this.options.find((t) => t._2.contains(fp)).get()._1;
  }

  getOptions(): Set<FeaturePointer> {
    return this.options
      .values()
      .foldLeft(HashSet.empty<FeaturePointer>() as Set<FeaturePointer>, (res, o) => res.union(o));
  }

  isEmpty(): boolean {
    return this.options.values().foldLeft(true, (res, o) => res && o.isEmpty());
  }

  merge(ma: MeepleAction): MeepleAction {
    let options = this.options;
    for (const t of ma.options) {
      const fps = options.get(t._1).getOrElse(HashSet.empty<FeaturePointer>());
      options = options.put(t._1, fps.addAll(t._2));
    }
    return new MeepleAction(this.meepleType, options, this.origin);
  }

  select(fp: FeaturePointer): ReplayableMessage {
    return new DeployMeepleMessage(fp, this.getMeepleIdFor(fp));
  }

  [Symbol.iterator](): Iterator<FeaturePointer> {
    return this.getOptions()[Symbol.iterator]();
  }
}
