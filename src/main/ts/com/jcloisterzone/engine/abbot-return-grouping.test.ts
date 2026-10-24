// An abbot sitting on an INCOMPLETE monastic feature may be returned voluntarily to score it
// (AbbotCapability). With several such abbots the offer must be ONE ReturnMeeple action carrying
// one option per abbot — not one action per abbot, which is what the client rendered as the same
// "return abbot" item twice/three times.
//
// Board: a row of BA/L tiles (monastery + field on every edge, so anything fits at rotation 0).
// Nothing is ever surrounded, so every monastery stays incomplete and the abbots stay returnable.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { describe, it, expect } from "vitest";
import { setDomParserFactory, type XmlDOMParser } from "../XmlUtils.js";
import { Engine } from "./Engine.js";

setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);

const REPO = process.cwd();
const BASIC_XML = readFileSync(resolve(join(REPO, "xmls", "basic.xml")), "utf8");

const ROW_SET = `<?xml version="1.0" encoding="utf-8"?>
<defs><sets><tile-set id="row"><ref count="24" tile="BA/L" /></tile-set></sets></defs>`;

type State = Record<string, unknown>;
type ReturnItem = { type: string; source?: string; options?: unknown[] };
type ActionState = { items: ReturnItem[] };

class Game {
  private readonly engine: Engine;
  readonly setup: State;

  constructor(abbots: number) {
    this.engine = new Engine(() => "");
    (this.engine as unknown as { tileDefinitions: string[] }).tileDefinitions = [BASIC_XML, ROW_SET];
    this.setup = this.send({
      type: "GAME_SETUP",
      payload: {
        initialRandom: 0.5191767944266055,
        players: 1,
        gameAnnotations: {},
        sets: { row: 1 },
        elements: { "small-follower": 7, farmers: true, abbot: abbots },
        rules: {},
        start: [{ tile: "BA/L", x: 0, y: 0, rotation: 0 }],
      },
    });
  }

  send(msg: unknown): State {
    return JSON.parse(this.engine.processInput(JSON.stringify(msg))!) as State;
  }

  place(x: number): State {
    return this.send({
      type: "PLACE_TILE",
      payload: { tileId: "BA/L", rotation: "R0", position: [x, 0] },
      player: 0,
    });
  }

  deployAbbot(x: number, n: number): State {
    return this.send({
      type: "DEPLOY_MEEPLE",
      payload: {
        pointer: { position: [x, 0], location: "I", feature: "Monastery" },
        meepleId: `0.abbot.${n}`,
      },
      player: 0,
    });
  }

  pass(): State {
    return this.send({ type: "PASS", payload: {}, player: 0 });
  }

  commit(): State {
    return this.send({ type: "COMMIT", payload: { random: 0.0 }, player: 0 });
  }
}

/** Every ABBOT_RETURN action offered in the current action phase. */
function abbotReturns(state: State): ReturnItem[] {
  const action = state.action as ActionState | null;
  if (action === null) return [];
  return action.items.filter((i) => i.type === "ReturnMeeple" && i.source === "ABBOT_RETURN");
}

describe("Abbot return grouping", () => {
  it("offers ONE action with one option per returnable abbot", () => {
    const game = new Game(2);

    // turn 1: abbot #1 onto the monastery at (1,0)
    game.place(1);
    game.deployAbbot(1, 1);
    game.commit();

    // turn 2: abbot #2 onto the monastery at (2,0)
    game.place(2);
    game.deployAbbot(2, 2);
    game.commit();

    // turn 3: both abbots sit on incomplete monasteries, so both are returnable
    const state = game.place(3);
    const returns = abbotReturns(state);

    // the regression: this used to be 2 separate actions (one per abbot)
    expect(returns).toHaveLength(1);
    expect(returns[0].options).toHaveLength(2);

    // the options point at the two abbots, each on its own monastery
    const ids = (returns[0].options as Array<{ meepleId: string }>).map((o) => o.meepleId).sort();
    expect(ids).toEqual(["0.abbot.1", "0.abbot.2"]);
  });

  it("still offers a single-option action for one abbot", () => {
    const game = new Game(2);

    game.place(1);
    game.deployAbbot(1, 1);
    game.commit();

    const state = game.place(2);
    const returns = abbotReturns(state);

    expect(returns).toHaveLength(1);
    expect(returns[0].options).toHaveLength(1);
  });

  it("offers nothing while no abbot is deployed", () => {
    const game = new Game(2);
    const state = game.place(1);
    expect(abbotReturns(state)).toHaveLength(0);
  });
});
