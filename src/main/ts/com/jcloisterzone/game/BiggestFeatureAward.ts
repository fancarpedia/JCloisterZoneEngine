import { JavaEnum } from "../../../lang/JavaEnum.js";
import type { Token } from "./Token.js";

/** Award tokens for the biggest completed feature (King = biggest city,
 *  Robber = longest road). */
export class BiggestFeatureAward extends JavaEnum implements Token {
  static readonly KING = new BiggestFeatureAward("KING", 0);
  static readonly ROBBER = new BiggestFeatureAward("ROBBER", 1);

  private static readonly VALUES: readonly BiggestFeatureAward[] = [
    BiggestFeatureAward.KING,
    BiggestFeatureAward.ROBBER,
  ];

  static values(): readonly BiggestFeatureAward[] {
    return BiggestFeatureAward.VALUES;
  }
}
