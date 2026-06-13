import { JavaEnum } from "../../../../lang/JavaEnum.js";
import type { Token } from "../Token.js";

/** Flowers (Village Life): each player is dealt one flower-colour token at game
 *  start; matching flowers on scored features grant +3 each. */
export class FlowersToken extends JavaEnum implements Token {
  static readonly FLOWERS_BLUE = new FlowersToken("FLOWERS_BLUE", 0, "blue");
  static readonly FLOWERS_VIOLET = new FlowersToken("FLOWERS_VIOLET", 1, "violet");
  static readonly FLOWERS_WHITE = new FlowersToken("FLOWERS_WHITE", 2, "white");
  static readonly FLOWERS_YELLOW = new FlowersToken("FLOWERS_YELLOW", 3, "yellow");

  private static readonly VALUES: readonly FlowersToken[] = [
    FlowersToken.FLOWERS_BLUE,
    FlowersToken.FLOWERS_VIOLET,
    FlowersToken.FLOWERS_WHITE,
    FlowersToken.FLOWERS_YELLOW,
  ];

  private constructor(
    name: string,
    ordinal: number,
    private readonly value: string,
  ) {
    super(name, ordinal);
  }

  override toString(): string {
    return this.value;
  }

  static values(): readonly FlowersToken[] {
    return FlowersToken.VALUES;
  }

  static fromValue(value: string): FlowersToken {
    const t = FlowersToken.VALUES.find((v) => v.value === value);
    if (!t) throw new Error("Unknown flowers token " + value);
    return t;
  }
}
