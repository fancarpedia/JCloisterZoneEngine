import { JavaEnum, enumValueOf } from "../../../lang/JavaEnum.js";

/** The four corners of a tile. */
export class Corner extends JavaEnum {
  static readonly NW = new Corner("NW", 0);
  static readonly NE = new Corner("NE", 1);
  static readonly SE = new Corner("SE", 2);
  static readonly SW = new Corner("SW", 3);

  private static readonly VALUES: readonly Corner[] = [
    Corner.NW,
    Corner.NE,
    Corner.SE,
    Corner.SW,
  ];

  static values(): readonly Corner[] {
    return Corner.VALUES;
  }

  static valueOf(name: string): Corner {
    return enumValueOf(Corner.VALUES, name);
  }
}
