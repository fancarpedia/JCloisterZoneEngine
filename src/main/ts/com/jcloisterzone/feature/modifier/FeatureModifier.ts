import type { SetupQuery } from "../../game/setup/SetupQuery.js";

/**
 * A feature modifier (e.g. cathedral, pennant, shrine). Singleton instances are
 * used as identity keys in a feature's modifier map.
 *
 * NOTE: `scoringScript` is retained as inert data only — the GraalVM script
 * evaluation path is intentionally NOT ported (see memory: GraalVM dropped).
 */
export abstract class FeatureModifier<T> {
  private readonly selector: string;
  private readonly name: string;
  private readonly enabledBy: SetupQuery | null;
  private scoringScript: string | null = null;

  constructor(selector: string, enabledBy: SetupQuery | null) {
    this.selector = selector;
    this.name = selector.replace(/\w+\[([-\w]+)\]/g, "$1");
    this.enabledBy = enabledBy;
  }

  getSelector(): string {
    return this.selector;
  }

  getName(): string {
    return this.name;
  }

  getEnabledBy(): SetupQuery | null {
    return this.enabledBy;
  }

  getScoringScript(): string | null {
    return this.scoringScript;
  }

  setScoringScript(scoringScript: string | null): void {
    this.scoringScript = scoringScript;
  }

  toString(): string {
    return this.name;
  }

  /** Whether the modifier must be present on both merged features. */
  isExclusive(a: T): boolean {
    return false;
  }

  abstract mergeValues(a: T, b: T): T | null;
  abstract valueOf(attr: string): T;
}
