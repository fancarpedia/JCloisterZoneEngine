import { Valued, combineHash, equals, hashCode, hashString } from "../../../../io/vavr/equality.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import { Location } from "../Location.js";
import { Position } from "../Position.js";
import type { FeatureClass } from "./FeaturePointer.js";
import { FeaturePointer } from "./FeaturePointer.js";
import type { BoardPointer } from "./BoardPointer.js";

/** Minimal view of a Meeple (avoids a figure import cycle). */
interface HasId {
  getId(): string;
}

/** Points at a feature on the board or a placed meeple. */
export class MeeplePointer implements BoardPointer, Valued {
  private readonly featurePointer: FeaturePointer;
  private readonly meepleId: string | null;

  constructor(featurePointer: FeaturePointer, meepleId: string | null);
  constructor(t: Tuple2<HasId, FeaturePointer>);
  constructor(
    position: Position,
    feature: FeatureClass | null,
    location: Location | null,
    meepleId: string | null,
  );
  constructor(a: FeaturePointer | Tuple2<HasId, FeaturePointer> | Position, b?: unknown, c?: unknown, d?: unknown) {
    if (a instanceof Tuple2) {
      this.featurePointer = a._2;
      this.meepleId = a._1.getId();
    } else if (a instanceof Position) {
      this.featurePointer = new FeaturePointer(a, (b as FeatureClass | null) ?? null, (c as Location | null) ?? null);
      this.meepleId = (d as string | null) ?? null;
    } else {
      this.featurePointer = a;
      this.meepleId = (b as string | null) ?? null;
    }
  }

  asFeaturePointer(): FeaturePointer {
    return this.featurePointer;
  }

  getPosition(): Position {
    return this.featurePointer.getPosition();
  }

  getLocation(): Location | null {
    return this.featurePointer.getLocation();
  }

  getMeepleId(): string | null {
    return this.meepleId;
  }

  setFeaturePointer(fp: FeaturePointer): MeeplePointer {
    return new MeeplePointer(fp, this.meepleId);
  }

  match(meeple: HasId | null): boolean {
    if (meeple === null) return false;
    if (this.meepleId === null) return false;
    return this.meepleId === meeple.getId();
  }

  toString(): string {
    return `[x=${this.getPosition().x},y=${this.getPosition().y},${this.getLocation()},${this.meepleId}]`;
  }

  hashCode(): number {
    return combineHash(
      hashCode(this.featurePointer),
      this.meepleId === null ? 0 : hashString(this.meepleId),
    );
  }

  equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof MeeplePointer)) return false;
    return equals(this.featurePointer, obj.featurePointer) && this.meepleId === obj.meepleId;
  }
}
