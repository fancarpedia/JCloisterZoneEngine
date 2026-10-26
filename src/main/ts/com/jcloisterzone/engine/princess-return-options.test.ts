// A ReturnMeeple action must carry ONE option per returnable meeple, whatever the source — the
// same grouping the Abbot return needed (see abbot-return-grouping.test.ts). Princess is the
// case where the options are a MIXTURE of figure types: placing a princess tile that extends a
// city offers the removal of every follower in it, the Phantom among them.
//
// Two followers can only end up in ONE city by MERGING two cities that were occupied separately
// (a second follower cannot be deployed into an already-occupied city — which is also why the
// Phantom has to go into the city on the turn its own tile is placed, with the ordinary follower
// parked on a field of that same tile).
//
// Board — `start` preplacement bypasses placement legality, so the two cities can be seeded with
// a gap between them. Tiles: DG/Cc.p is a princess city on N+W (fields S+E), DG/Ccc.p a princess
// city on N+E+W. Rotation is clockwise: R90 maps N->E, E->S, S->W, W->N.
//
//        (0,-1) Cc.p R180      (2,-1) Cc.p R180      city A = (0,0)+(0,-1)
//        city S+E              city S+E              city B = (2,0)+(2,-1)
//   (0,0) Cc.p R90    [gap]    (2,0) Cc.p R0         the gap tile touches both
//   city N+E          (1,0)    city N+W
//
// Every city keeps an edge open onto an empty position throughout, so nothing is ever completed
// and no follower is returned by scoring before the princess action is offered.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { describe, it, expect } from "vitest";
import { setDomParserFactory, type XmlDOMParser } from "../XmlUtils.js";
import { Engine } from "./Engine.js";

setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);

const REPO = process.cwd();
const BASIC_XML = readFileSync(resolve(join(REPO, "xmls", "basic.xml")), "utf8");
const DRAGON_XML = readFileSync(resolve(join(REPO, "xmls", "princess_and_dragon.xml")), "utf8");

const CITY_SET = `<?xml version="1.0" encoding="utf-8"?>
<defs><sets><tile-set id="pcity">
  <ref count="12" tile="DG/Cc.p" /><ref count="12" tile="DG/Ccc.p" />
</tile-set></sets></defs>`;

type State = Record<string, unknown>;
type Pointer = { position: [number, number]; location: string; feature: string };
type Item = { type: string; meeple?: string; source?: string; options?: unknown[] };
type ActionState = { items: Item[] };

class Game {
  private readonly engine: Engine;
  readonly setup: State;

  constructor() {
    this.engine = new Engine(() => "");
    (this.engine as unknown as { tileDefinitions: string[] }).tileDefinitions = [
      BASIC_XML,
      DRAGON_XML,
      CITY_SET,
    ];
    this.setup = this.send({
      type: "GAME_SETUP",
      payload: {
        initialRandom: 0.5191767944266055,
        players: 1,
        // the deck holds two tile types, so pin the draws instead of relying on the shuffle
        gameAnnotations: { drawOrder: ["DG/Cc.p", "DG/Cc.p", "DG/Ccc.p"] },
        sets: { pcity: 1 },
        elements: { "small-follower": 7, farmers: true, princess: true, phantom: 1 },
        rules: {},
        start: [
          { tile: "DG/Cc.p", x: 0, y: 0, rotation: 90 },
          { tile: "DG/Cc.p", x: 2, y: 0, rotation: 0 },
        ],
      },
    });
  }

  send(msg: unknown): State {
    return JSON.parse(this.engine.processInput(JSON.stringify(msg))!) as State;
  }

  place(tileId: string, x: number, y: number, rotation: string): State {
    return this.send({
      type: "PLACE_TILE",
      payload: { tileId, rotation, position: [x, y] },
      player: 0,
    });
  }

  deploy(pointer: Pointer, meepleId: string): State {
    return this.send({ type: "DEPLOY_MEEPLE", payload: { pointer, meepleId }, player: 0 });
  }

  pass(): State {
    return this.send({ type: "PASS", payload: {}, player: 0 });
  }

  commit(): State {
    return this.send({ type: "COMMIT", payload: { random: 0.0 }, player: 0 });
  }
}

function items(state: State): Item[] {
  const action = state.action as ActionState | null;
  return action === null ? [] : action.items;
}

/** An offered option for `meeple` on the given feature — avoids hardcoding merged locations. */
function option(state: State, meeple: string, feature: string): Pointer {
  const item = items(state).find((i) => i.type === "Meeple" && i.meeple === meeple);
  if (item === undefined) {
    throw new Error(`no Meeple action for ${meeple}: ${JSON.stringify(items(state))}`);
  }
  const found = (item.options as Pointer[]).find((o) => o.feature === feature);
  if (found === undefined) {
    throw new Error(`no ${feature} option for ${meeple}: ${JSON.stringify(item.options)}`);
  }
  return found;
}

function princessReturns(state: State): Item[] {
  return items(state).filter((i) => i.type === "ReturnMeeple" && i.source === "PRINCESS");
}

describe("Princess return options", () => {
  it("offers ONE action listing every follower in the merged city, Phantom included", () => {
    const game = new Game();

    // turn 1 — extend city A; the ordinary follower goes on a field so the Phantom can take the city
    let state = game.place("DG/Cc.p", 0, -1, "R180");
    state = game.deploy(option(state, "SmallFollower", "Field"), "0.small.1");
    state = game.deploy(option(state, "Phantom", "City"), "0.phantom.1");
    game.commit();

    // turn 2 — extend city B and occupy it
    state = game.place("DG/Cc.p", 2, -1, "R180");
    state = game.deploy(option(state, "SmallFollower", "City"), "0.small.2");
    game.commit();

    // turn 3 — the gap tile merges A and B and carries a princess pennant on that city
    state = game.place("DG/Ccc.p", 1, 0, "R0");
    const returns = princessReturns(state);

    expect(returns).toHaveLength(1); // ONE action, not one per removable follower
    const ids = (returns[0].options as Array<{ meepleId: string }>).map((o) => o.meepleId).sort();
    expect(ids).toEqual(["0.phantom.1", "0.small.2"]);
  });
});
