import { JavaEnum, enumValueOf } from "../../../lang/JavaEnum.js";

/**
 * Possible tile rotations. (The AWT AffineTransform helpers from the Java
 * original are UI-only and intentionally omitted from this engine port.)
 */
export class Rotation extends JavaEnum {
  static readonly R0 = new Rotation("R0", 0);
  static readonly R90 = new Rotation("R90", 1);
  static readonly R180 = new Rotation("R180", 2);
  static readonly R270 = new Rotation("R270", 3);

  private static readonly VALUES: readonly Rotation[] = [
    Rotation.R0,
    Rotation.R90,
    Rotation.R180,
    Rotation.R270,
  ];

  static values(): readonly Rotation[] {
    return Rotation.VALUES;
  }

  static valueOf(name: string): Rotation {
    return enumValueOf(Rotation.VALUES, name);
  }

  /** Next rotation clockwise (+90 degrees). */
  next(): Rotation {
    return Rotation.VALUES[(this.ordinal() + 1) % Rotation.VALUES.length];
  }

  /** Previous rotation clockwise (-90 degrees). */
  prev(): Rotation {
    return Rotation.VALUES[(this.ordinal() + Rotation.VALUES.length - 1) % Rotation.VALUES.length];
  }

  /** Angle in radians associated with this rotation. */
  getTheta(): number {
    return (this.ordinal() * Math.PI) / 2.0;
  }

  /** Adds rotation r to this. */
  add(r: Rotation): Rotation {
    return Rotation.VALUES[(this.ordinal() + r.ordinal()) % Rotation.VALUES.length];
  }

  /** Inverse of this rotation (+180 degrees mirror of the angle). */
  inverse(): Rotation {
    switch (this) {
      case Rotation.R0:
        return Rotation.R0;
      case Rotation.R90:
        return Rotation.R270;
      case Rotation.R180:
        return Rotation.R180;
      case Rotation.R270:
        return Rotation.R90;
    }
    throw new Error("IllegalState");
  }
}
