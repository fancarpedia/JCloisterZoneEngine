import { JavaEnum, enumValueOf } from "../../../lang/JavaEnum.js";

/**
 * All possible edge types. An edge can contain a field, a river, a city or a
 * road (plus a city gate, and an "any"/unknown wildcard).
 */
export class EdgeType extends JavaEnum {
  static readonly ROAD = new EdgeType("ROAD", 0, 0b0001, "R");
  static readonly CITY = new EdgeType("CITY", 1, 0b0010, "C");
  static readonly FIELD = new EdgeType("FIELD", 2, 0b0100, "F");
  static readonly RIVER = new EdgeType("RIVER", 3, 0b1000, "I");
  static readonly CITY_GATE = new EdgeType("CITY_GATE", 4, 0b0101, "G");
  static readonly ANY = new EdgeType("ANY", 5, 0b1111, "?");

  private static readonly VALUES: readonly EdgeType[] = [
    EdgeType.ROAD,
    EdgeType.CITY,
    EdgeType.FIELD,
    EdgeType.RIVER,
    EdgeType.CITY_GATE,
    EdgeType.ANY,
  ];

  private readonly mask: number;
  private readonly ch: string;

  constructor(name: string, ordinal: number, mask: number, ch: string) {
    super(name, ordinal);
    this.mask = mask;
    this.ch = ch;
  }

  getMask(): number {
    return this.mask;
  }

  asChar(): string {
    return this.ch;
  }

  static values(): readonly EdgeType[] {
    return EdgeType.VALUES;
  }

  static valueOf(name: string): EdgeType {
    return enumValueOf(EdgeType.VALUES, name);
  }

  static forMask(mask: number): EdgeType {
    const e = EdgeType.VALUES.find((x) => x.mask === mask);
    if (!e) throw new Error("Invalid Edge mask " + mask);
    return e;
  }

  static forChar(ch: string): EdgeType {
    const e = EdgeType.VALUES.find((x) => x.ch === ch);
    if (!e) throw new Error("Unknown edge " + ch);
    return e;
  }
}
