import type { List } from "../../../io/vavr/SeqTypes.js";
import type { Map as VMap } from "../../../io/vavr/Map.js";
import type { Set } from "../../../io/vavr/Set.js";
import type { ClassToken } from "../../../lang/Class.js";
import type { Meeple } from "../figure/Meeple.js";
import type { Capability } from "./Capability.js";
import type { Rule } from "./Rule.js";
import type { GameSetupMessage } from "../io/message/GameSetupMessage.js";

type CapClass = ClassToken<Capability<unknown>>;
type MeepleClass = ClassToken<Meeple>;
type PlacedTileItem = GameSetupMessage.PlacedTileItem;

/** Immutable game configuration (tile sets, elements, meeples, rules, capabilities, start tiles).
 *  Implements RulesMixin (getStringRule/getBooleanRule inlined). */
export class GameSetup {
  constructor(
    private readonly tileSets: VMap<string, number>,
    private readonly elements: VMap<string, unknown>,
    private readonly meeples: VMap<MeepleClass, number>,
    private readonly capabilities: Set<CapClass>,
    private readonly rules: VMap<Rule, unknown>,
    private readonly start: List<PlacedTileItem>,
  ) {}

  getTileSets(): VMap<string, number> {
    return this.tileSets;
  }
  setTileSets(tileSets: VMap<string, number>): GameSetup {
    if (this.tileSets === tileSets) return this;
    return new GameSetup(tileSets, this.elements, this.meeples, this.capabilities, this.rules, this.start);
  }

  getElements(): VMap<string, unknown> {
    return this.elements;
  }
  setElements(elements: VMap<string, unknown>): GameSetup {
    if (this.elements === elements) return this;
    return new GameSetup(this.tileSets, elements, this.meeples, this.capabilities, this.rules, this.start);
  }

  getMeeples(): VMap<MeepleClass, number> {
    return this.meeples;
  }
  setMeeples(meeples: VMap<MeepleClass, number>): GameSetup {
    if (this.meeples === meeples) return this;
    return new GameSetup(this.tileSets, this.elements, meeples, this.capabilities, this.rules, this.start);
  }

  getRules(): VMap<Rule, unknown> {
    return this.rules;
  }
  setRules(rules: VMap<Rule, unknown>): GameSetup {
    if (this.rules === rules) return this;
    return new GameSetup(this.tileSets, this.elements, this.meeples, this.capabilities, rules, this.start);
  }
  mapRules(mapper: (r: VMap<Rule, unknown>) => VMap<Rule, unknown>): GameSetup {
    return this.setRules(mapper(this.rules));
  }

  getCapabilities(): Set<CapClass> {
    return this.capabilities;
  }
  setCapabilities(capabilities: Set<CapClass>): GameSetup {
    if (this.capabilities === capabilities) return this;
    return new GameSetup(this.tileSets, this.elements, this.meeples, capabilities, this.rules, this.start);
  }
  mapCapabilities(mapper: (c: Set<CapClass>) => Set<CapClass>): GameSetup {
    return this.setCapabilities(mapper(this.capabilities));
  }

  getStart(): List<PlacedTileItem> {
    return this.start;
  }

  contains(cap: CapClass): boolean {
    return this.capabilities.contains(cap);
  }

  // --- RulesMixin (inlined) ---
  getStringRule(rule: Rule): string {
    return this.rules.get(rule).getOrNull() as string;
  }
  getBooleanRule(rule: Rule): boolean {
    return this.rules.get(rule).getOrElse(false) as boolean;
  }
}
