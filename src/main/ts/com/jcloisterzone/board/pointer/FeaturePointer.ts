import { Valued, combineHash, equals, hashCode } from "../../../../io/vavr/equality.js";
import { List, Stream } from "../../../../io/vavr/SeqTypes.js";
import { ClassToken, simpleName } from "../../../../lang/Class.js";
import { Location } from "../Location.js";
import { Position } from "../Position.js";
import { Rotation } from "../Rotation.js";
import type { BoardPointer } from "./BoardPointer.js";

/** A class token for a Feature subtype (Java Class<? extends Feature>). */
export type FeatureClass = ClassToken;

/**
 * Predicate "is this feature class a Field?", injected by Field.ts to avoid a
 * module cycle (FeaturePointer <- Feature <- Field).
 */
let isFieldClass: (cls: FeatureClass | null) => boolean = () => false;
export function __setIsFieldClass(fn: (cls: FeatureClass | null) => boolean): void {
  isFieldClass = fn;
}

/** Points at a feature space (position + feature type + location) on the board. */
export class FeaturePointer implements BoardPointer, Valued {
  constructor(
    private readonly position: Position,
    private readonly feature: FeatureClass | null,
    private readonly location: Location | null,
  ) {}

  asFeaturePointer(): FeaturePointer {
    return this;
  }

  translate(pos: Position): FeaturePointer {
    return new FeaturePointer(this.position.add(pos), this.feature, this.location);
  }

  rotateCW(rot: Rotation): FeaturePointer {
    return new FeaturePointer(this.position, this.feature, this.location!.rotateCW(rot));
  }

  rotateCCW(rot: Rotation): FeaturePointer {
    return new FeaturePointer(this.position, this.feature, this.location!.rotateCCW(rot));
  }

  getAdjacent(): Stream<FeaturePointer> {
    const location = this.location!;
    if (isFieldClass(this.feature)) {
      return Stream.ofAll(Location.SIDES).flatMap((loc) => {
        let res: List<FeaturePointer> = List.empty<FeaturePointer>();
        const l = loc.getLeftField();
        const r = loc.getRightField();
        if (l.intersect(location) !== null) {
          res = res.prepend(
            new FeaturePointer(this.position.add(loc), this.feature, l.rev()),
          ) as List<FeaturePointer>;
        }
        if (r.intersect(location) !== null) {
          res = res.prepend(
            new FeaturePointer(this.position.add(loc), this.feature, r.rev()),
          ) as List<FeaturePointer>;
        }
        return res;
      }) as Stream<FeaturePointer>;
    }
    return Stream.ofAll(Location.SIDES)
      .filter((loc) => loc.intersect(location) !== null)
      .map(
        (loc) => new FeaturePointer(this.position.add(loc), this.feature, loc.rev()),
      ) as Stream<FeaturePointer>;
  }

  isPartOf(other: FeaturePointer): boolean {
    return (
      this.position.equals(other.position) &&
      this.feature === other.feature &&
      this.location!.isPartOf(other.location!)
    );
  }

  getPosition(): Position {
    return this.position;
  }

  setPosition(position: Position): FeaturePointer {
    if (this.position === position) return this;
    return new FeaturePointer(position, this.feature, this.location);
  }

  getFeature(): FeatureClass | null {
    return this.feature;
  }

  setFeature(feature: FeatureClass | null): FeaturePointer {
    if (this.feature === feature) return this;
    return new FeaturePointer(this.position, feature, this.location);
  }

  getLocation(): Location | null {
    return this.location;
  }

  setLocation(location: Location | null): FeaturePointer {
    if (this.location === location) return this;
    return new FeaturePointer(this.position, this.feature, location);
  }

  toString(): string {
    return `{${this.position},${this.feature ? simpleName(this.feature) : "null"},${this.location}}`;
  }

  hashCode(): number {
    return combineHash(
      hashCode(this.position),
      this.feature ? hashCode(this.feature) : 0,
      this.location ? hashCode(this.location) : 0,
    );
  }

  equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof FeaturePointer)) return false;
    return (
      equals(this.location, obj.location) &&
      this.feature === obj.feature &&
      equals(this.position, obj.position)
    );
  }
}
