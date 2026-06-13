import { Valued, combineHash, equals, hashCode } from "../../../io/vavr/equality.js";
import type { FeaturePointer } from "./pointer/FeaturePointer.js";
import { Position } from "./Position.js";
import { Rotation } from "./Rotation.js";

/** An allowed tile placement at a particular board position. */
export class PlacementOption implements Valued {
  constructor(
    private readonly position: Position,
    private readonly rotation: Rotation,
    /** not null if a bridge must be placed to make the placement legal */
    private readonly mandatoryBridge: FeaturePointer | null,
  ) {}

  getPosition(): Position {
    return this.position;
  }

  getRotation(): Rotation {
    return this.rotation;
  }

  getMandatoryBridge(): FeaturePointer | null {
    return this.mandatoryBridge;
  }

  toString(): string {
    let s = `{${this.position},${this.rotation}`;
    if (this.mandatoryBridge !== null) {
      s += `,bridge=${this.mandatoryBridge}`;
    }
    return s + "}";
  }

  hashCode(): number {
    return combineHash(
      hashCode(this.position),
      hashCode(this.rotation),
      this.mandatoryBridge ? hashCode(this.mandatoryBridge) : 0,
    );
  }

  equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof PlacementOption)) return false;
    return (
      equals(this.position, obj.position) &&
      equals(this.rotation, obj.rotation) &&
      equals(this.mandatoryBridge, obj.mandatoryBridge)
    );
  }

  compareTo(o: PlacementOption): number {
    const p = this.position.compareTo(o.position);
    if (p !== 0) return p;
    return this.rotation.ordinal() - o.rotation.ordinal();
  }
}
