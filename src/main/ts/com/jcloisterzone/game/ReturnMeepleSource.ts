import { JavaEnum, enumValueOf } from "../../../lang/JavaEnum.js";

/** Why a meeple is being returned (drives validation/scoring). */
export class ReturnMeepleSource extends JavaEnum {
  static readonly PRINCESS = new ReturnMeepleSource("PRINCESS", 0);
  static readonly SIEGE_ESCAPE = new ReturnMeepleSource("SIEGE_ESCAPE", 1);
  static readonly FESTIVAL = new ReturnMeepleSource("FESTIVAL", 2);
  static readonly CORN_CIRCLE = new ReturnMeepleSource("CORN_CIRCLE", 3);
  static readonly ABBOT_RETURN = new ReturnMeepleSource("ABBOT_RETURN", 4);
  static readonly MONASTERY_SHRINE_CHALLENGE = new ReturnMeepleSource("MONASTERY_SHRINE_CHALLENGE", 5);
  static readonly BARN_PLACEMENT = new ReturnMeepleSource("BARN_PLACEMENT", 6);
  static readonly BARN_FIELD_JOIN = new ReturnMeepleSource("BARN_FIELD_JOIN", 7);
  static readonly TRAP = new ReturnMeepleSource("TRAP", 8);
  static readonly ROBBERS_SON = new ReturnMeepleSource("ROBBERS_SON", 9);

  private static readonly VALUES: readonly ReturnMeepleSource[] = [
    ReturnMeepleSource.PRINCESS, ReturnMeepleSource.SIEGE_ESCAPE, ReturnMeepleSource.FESTIVAL,
    ReturnMeepleSource.CORN_CIRCLE, ReturnMeepleSource.ABBOT_RETURN, ReturnMeepleSource.MONASTERY_SHRINE_CHALLENGE,
    ReturnMeepleSource.BARN_PLACEMENT, ReturnMeepleSource.BARN_FIELD_JOIN, ReturnMeepleSource.TRAP,
    ReturnMeepleSource.ROBBERS_SON,
  ];

  static values(): readonly ReturnMeepleSource[] {
    return ReturnMeepleSource.VALUES;
  }
  static valueOf(name: string): ReturnMeepleSource {
    return enumValueOf(ReturnMeepleSource.VALUES, name);
  }
}
