import { JavaEnum, enumValueOf } from "../../../lang/JavaEnum.js";

/** Symmetry condition of a tile. */
export class TileSymmetry extends JavaEnum {
  /** No symmetry. */
  static readonly NONE = new TileSymmetry("NONE", 0);
  /** Opposite edges are equal. */
  static readonly S2 = new TileSymmetry("S2", 1);
  /** All edges are equal. */
  static readonly S4 = new TileSymmetry("S4", 2);

  private static readonly VALUES: readonly TileSymmetry[] = [
    TileSymmetry.NONE,
    TileSymmetry.S2,
    TileSymmetry.S4,
  ];

  static values(): readonly TileSymmetry[] {
    return TileSymmetry.VALUES;
  }

  static valueOf(name: string): TileSymmetry {
    return enumValueOf(TileSymmetry.VALUES, name);
  }
}
