// Mini Meeple (fan expansion). Placing a REGULAR tile into a hole — a position whose four
// orthogonal neighbours are all occupied — grants the placing player one Mini (a follower of
// power 0.5), up to the per-game cap carried by the `mini-follower` element. The abbey tile
// never grants one, and an unearned Mini must not appear in the supply at all.
//
// The board is built with `start` preplacement, which bypasses placement legality — so a ring
// of 8 tiles can be dropped around an empty centre to manufacture a hole. Every tile is BA/L
// (monastery + field on all four edges), so any tile fits any neighbour at rotation 0 and the
// draw order is irrelevant.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { describe, it, expect } from "vitest";
import { Player } from "../Player.js";
import type { Scoreable } from "../feature/Scoreable.js";
import { MiniFollower } from "../figure/MiniFollower.js";
import type { GameState } from "../game/state/GameState.js";
import { setDomParserFactory, type XmlDOMParser } from "../XmlUtils.js";
import { Engine } from "./Engine.js";

setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);

const REPO = process.cwd();
const BASIC_XML = readFileSync(resolve(join(REPO, "xmls", "basic.xml")), "utf8");
const ABBEY_XML = readFileSync(resolve(join(REPO, "xmls", "abbey_and_mayor.xml")), "utf8");

const MINI_SET = `<?xml version="1.0" encoding="utf-8"?>
<defs><sets><tile-set id="mini"><ref count="24" tile="BA/L" /></tile-set></sets></defs>`;

type State = Record<string, unknown>;
type PlayerState = { points: number; meeples: Record<string, [number, string]> };
type ActionState = { items: Array<{ type: string; meeple?: string }> };

/** The 8 cells around `centre` — everything needed to make `centre` a hole. */
function ring(cx: number, cy: number): Array<{ tile: string; x: number; y: number; rotation: number }> {
  const out = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      out.push({ tile: "BA/L", x: cx + dx, y: cy + dy, rotation: 0 });
    }
  }
  return out;
}

class Game {
  private readonly engine: Engine;
  readonly setup: State;

  constructor(opts: {
    miniCap?: number;
    abbey?: boolean;
    preDraw?: number;
    holes: Array<[number, number]>;
  }) {
    this.engine = new Engine(() => "");
    (this.engine as unknown as { tileDefinitions: string[] }).tileDefinitions = [
      BASIC_XML,
      ABBEY_XML,
      MINI_SET,
    ];
    this.setup = this.send({
      type: "GAME_SETUP",
      payload: {
        initialRandom: 0.5191767944266055,
        players: 1,
        gameAnnotations: {},
        sets: { mini: 1 },
        elements: {
          "small-follower": 7,
          farmers: true,
          ...(opts.miniCap === undefined ? {} : { "mini-follower": opts.miniCap }),
          ...(opts.abbey ? { abbey: 1 } : {}),
          ...(opts.preDraw === undefined ? {} : { "pre-draw": opts.preDraw }),
        },
        rules: { "tiny-city-scoring": "4" },
        start: opts.holes.flatMap(([x, y]) => ring(x, y)),
      },
    });
  }

  send(msg: unknown): State {
    return JSON.parse(this.engine.processInput(JSON.stringify(msg))!) as State;
  }

  place(x: number, y: number, tileId = "BA/L"): State {
    return this.send({
      type: "PLACE_TILE",
      payload: { tileId, rotation: "R0", position: [x, y] },
      player: 0,
    });
  }

  deployOnMonastery(x: number, y: number, meepleId: string): State {
    return this.send({
      type: "DEPLOY_MEEPLE",
      payload: { pointer: { position: [x, y], location: "I", feature: "Monastery" }, meepleId },
      player: 0,
    });
  }

  /** Reveal and place a tile from the (server-secret) pre-draw hand. */
  placePreDrawn(x: number, y: number, tileId = "BA/L"): State {
    return this.send({
      type: "PLACE_PREDRAWN",
      payload: { tileId, rotation: "R0", position: [x, y] },
    });
  }

  pass(): State {
    return this.send({ type: "PASS", payload: {}, player: 0 });
  }

  commit(): State {
    return this.send({ type: "COMMIT", payload: { random: 0.0 }, player: 0 });
  }
}

function minis(state: State): number {
  const entry = (state.players as PlayerState[])[0].meeples.MiniFollower;
  return entry === undefined ? 0 : entry[0];
}

type HistoryEvent = { type: string; player?: number; meeple?: string; position?: [number, number] };

/** Play events recorded for the most recent turn. */
function turnEvents(state: State): HistoryEvent[] {
  const history = state.history as Array<{ events: HistoryEvent[] }>;
  return history.length === 0 ? [] : history[history.length - 1].events;
}

function awards(state: State): HistoryEvent[] {
  return turnEvents(state).filter((e) => e.type === "meeple-awarded");
}

/** The meeple classes the current action phase offers to deploy. */
function offeredMeeples(state: State): string[] {
  const action = state.action as ActionState | null;
  if (action === null) return [];
  return action.items.filter((i) => i.type === "Meeple").map((i) => i.meeple!);
}

describe("Mini Meeple", () => {
  it("has power 0.5", () => {
    const mini = new MiniFollower("0.mini.1", new Player(0));
    // getPower ignores both arguments for a fixed-power follower.
    expect(mini.getPower(null as unknown as GameState, null as unknown as Scoreable)).toBe(0.5);
  });

  it("is absent from the starting supply entirely", () => {
    const game = new Game({ miniCap: 2, holes: [[0, 0]] });
    // Not merely hidden — no Mini figure exists until one is awarded, so the supply has no
    // MiniFollower entry at all while the ordinary followers are all there.
    expect((game.setup.players as PlayerState[])[0].meeples.MiniFollower).toBeUndefined();
    expect((game.setup.players as PlayerState[])[0].meeples.SmallFollower[0]).toBe(7);
  });

  it("is granted by filling a hole, but cannot be played in the turn it was earned", () => {
    const game = new Game({ miniCap: 2, holes: [[0, 0]] });
    let state = game.place(0, 0);

    expect(state.phase).toBe("ActionPhase");
    expect(minis(state)).toBe(1); // earned...
    // ...but NOT offered this turn: the award sets Flag.MINI_MEEPLE_AWARDED and ActionPhase
    // honours it by dropping MiniFollower from the deployable types.
    expect(offeredMeeples(state)).not.toContain("MiniFollower");

    game.pass();
    game.commit();

    // Next turn an ordinary (non-hole) placement awards nothing, so the flag has been cleared
    // and the Mini earned last turn is finally deployable.
    state = game.place(2, 0);
    expect(minis(state)).toBe(1);
    expect(offeredMeeples(state)).toContain("MiniFollower");
  });

  it("records the award in the history, pointing at the tile that earned it", () => {
    const game = new Game({ miniCap: 2, holes: [[0, 0]] });
    const state = game.place(0, 0);

    expect(awards(state)).toHaveLength(1);
    const [ev] = awards(state);
    expect(ev.player).toBe(0);
    expect(ev.meeple).toBe("MiniFollower");
    // the placement that earned it — the client emphasizes this tile on hover
    expect(ev.position).toEqual([0, 0]);
  });

  it("records no award event when nothing is earned", () => {
    const plain = new Game({ miniCap: 2, holes: [[0, 0]] });
    expect(awards(plain.place(2, 0))).toHaveLength(0);

    const abbey = new Game({ miniCap: 2, abbey: true, holes: [[0, 0]] });
    expect(awards(abbey.place(0, 0, "AM/A"))).toHaveLength(0);
  });

  it("is not granted by an ordinary placement", () => {
    // (2,0) is adjacent to the ring but has only one neighbour, so it is not a hole.
    const game = new Game({ miniCap: 2, holes: [[0, 0]] });
    const state = game.place(2, 0);

    expect(state.phase).toBe("ActionPhase");
    expect(minis(state)).toBe(0);
    expect(offeredMeeples(state)).not.toContain("MiniFollower");
  });

  it("is not granted when the expansion is off", () => {
    const game = new Game({ holes: [[0, 0]] });
    const state = game.place(0, 0);

    expect(minis(state)).toBe(0);
    expect(offeredMeeples(state)).not.toContain("MiniFollower");
  });

  it("stops granting at the cap", () => {
    // Two holes, cap 1 — the second hole fill must grant nothing.
    const game = new Game({ miniCap: 1, holes: [[0, 0], [4, 0]] });

    let state = game.place(0, 0);
    expect(minis(state)).toBe(1);

    game.pass();
    game.commit();
    state = game.place(4, 0);
    expect(minis(state)).toBe(1);
  });

  it("is not granted by placing an abbey into a hole", () => {
    // With a hole already on the board, the turn opens in TileFromSupplyPhase offering the
    // abbey at (0,0) — so the abbey placement is the very first message.
    const game = new Game({ miniCap: 2, abbey: true, holes: [[0, 0]] });
    expect(game.setup.phase).toBe("TileFromSupplyPhase");

    const state = game.place(0, 0, "AM/A");
    expect((state.placedTiles as unknown[]).length).toBe(9); // the abbey did land in the hole
    expect(minis(state)).toBe(0);
  });

  it("is awarded for a hand tile placed from the supply phase", () => {
    // A pre-drawn tile is placed through TileFromSupplyPhase, like a bazaar-won tile — the
    // same phase the abbey uses. It is an ordinary tile, so filling a hole with it awards.
    const game = new Game({ miniCap: 2, preDraw: 3, holes: [[0, 0]] });
    expect(game.setup.phase).toBe("TileFromSupplyPhase");

    const state = game.placePreDrawn(0, 0);
    expect(state.phase).toBe("ActionPhase");
    expect(minis(state)).toBe(1);
    // Awarded, but — like any Mini — not playable in the turn that earned it.
    expect(offeredMeeples(state)).not.toContain("MiniFollower");
  });

  // The next two tests need a Mini actually ON a feature. Since a Mini cannot be played in the
  // turn it was earned — and a ring-hole's own monastery has all 8 neighbours, so it completes and
  // scores at that same turn's commit — the Mini is earned on the FIRST hole with the cap set to 1.
  // Filling the second hole then awards nothing (cap reached), so no flag is set and the Mini is
  // deployable on that second, freshly completed monastery.
  function gameWithPlayableMini(): { game: Game; state: State } {
    const game = new Game({ miniCap: 1, holes: [[0, 0], [4, 0]] });
    let state = game.place(0, 0); // earns the Mini (blocked this turn)
    expect(minis(state)).toBe(1);
    expect(offeredMeeples(state)).not.toContain("MiniFollower");
    game.pass();
    game.commit();

    state = game.place(4, 0); // cap reached → no award → no flag → Mini playable
    expect(offeredMeeples(state)).toContain("MiniFollower");
    return { game, state };
  }

  it("returns to the supply when its feature scores, and stays earned", () => {
    const { game } = gameWithPlayableMini();

    let state = game.deployOnMonastery(4, 0, "0.mini.1");
    expect(minis(state)).toBe(0); // deployed, so no longer in supply

    // The monastery on the just-placed tile has all 8 neighbours, so it completes and scores
    // at commit — returning the Mini to supply, still earned and usable again.
    state = game.commit();
    expect(minis(state)).toBe(1);
  });

  it("owns a feature on its own despite power 0.5", () => {
    const { game } = gameWithPlayableMini();
    game.deployOnMonastery(4, 0, "0.mini.1");
    const state = game.commit();

    // 0.5 > 0, so the lone Mini owns the completed 9-point monastery. (The first hole's own
    // monastery completed unoccupied last turn, so it contributed nothing.)
    expect((state.players as PlayerState[])[0].points).toBe(9);
  });
});
