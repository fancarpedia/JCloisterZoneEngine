import { JavaEnum } from "../../../../lang/JavaEnum.js";
import type { Token } from "../Token.js";

/** The Big Top animal tokens (Under the Big Top). Each carries a per-follower point value
 *  and how many copies exist per token set. */
export class AnimalToken extends JavaEnum implements Token {
  static readonly BIGTOP_1 = new AnimalToken("BIGTOP_1", 0, 1, 1);
  static readonly BIGTOP_3 = new AnimalToken("BIGTOP_3", 1, 3, 4);
  static readonly BIGTOP_4 = new AnimalToken("BIGTOP_4", 2, 4, 5);
  static readonly BIGTOP_5 = new AnimalToken("BIGTOP_5", 3, 5, 3);
  static readonly BIGTOP_6 = new AnimalToken("BIGTOP_6", 4, 6, 2);
  static readonly BIGTOP_7 = new AnimalToken("BIGTOP_7", 5, 7, 1);

  private static readonly VALUES: readonly AnimalToken[] = [
    AnimalToken.BIGTOP_1,
    AnimalToken.BIGTOP_3,
    AnimalToken.BIGTOP_4,
    AnimalToken.BIGTOP_5,
    AnimalToken.BIGTOP_6,
    AnimalToken.BIGTOP_7,
  ];

  constructor(
    name: string,
    ordinal: number,
    readonly points: number,
    readonly count: number,
  ) {
    super(name, ordinal);
  }

  static values(): readonly AnimalToken[] {
    return AnimalToken.VALUES;
  }

  static valueOf(name: string): AnimalToken {
    const v = AnimalToken.VALUES.find((t) => t.name() === name);
    if (v === undefined) throw new Error("No animal token " + name);
    return v;
  }
}
