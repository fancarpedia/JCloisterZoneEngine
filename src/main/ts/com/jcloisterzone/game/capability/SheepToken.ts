import { JavaEnum } from "../../../../lang/JavaEnum.js";
import type { Token } from "../Token.js";

/** Sheep / wolf tokens drawn from the flock bag (Hills & Sheep). */
export class SheepToken extends JavaEnum implements Token {
  static readonly SHEEP_1X = new SheepToken("SHEEP_1X", 0);
  static readonly SHEEP_2X = new SheepToken("SHEEP_2X", 1);
  static readonly SHEEP_3X = new SheepToken("SHEEP_3X", 2);
  static readonly SHEEP_4X = new SheepToken("SHEEP_4X", 3);
  static readonly WOLF = new SheepToken("WOLF", 4);

  private static readonly VALUES: readonly SheepToken[] = [
    SheepToken.SHEEP_1X,
    SheepToken.SHEEP_2X,
    SheepToken.SHEEP_3X,
    SheepToken.SHEEP_4X,
    SheepToken.WOLF,
  ];

  static values(): readonly SheepToken[] {
    return SheepToken.VALUES;
  }

  static valueOf(name: string): SheepToken {
    const v = SheepToken.VALUES.find((t) => t.name() === name);
    if (v === undefined) throw new Error("No SheepToken " + name);
    return v;
  }

  sheepCount(): number {
    if (this === SheepToken.WOLF) throw new Error("IllegalState");
    return this.ordinal() + 1;
  }
}
