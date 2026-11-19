// Kingdoms (fan expansion) — Kingdom Palaces.
//
// Each player holds Kingdom Palace tile(s) of their own colour (by slot). Instead of drawing they may
// place one, but only joining a city that holds one of their followers. A COMPLETED capital is a
// kingdom: at the end it scores, once per player owning a palace in it, 3 points per city touching
// a field that touches the capital — only COMPLETED cities, the capital itself included.
// An unfinished capital scores nothing.
//
// Board (preplaced, no meeples), BA/C = city on one edge, field everywhere else:
//
//   (0,-2) BA/C turned R180: city faces S, towards the empty (0,-1)
//   (0,0)  BA/C R0:          city faces N, towards the empty (0,-1)
//
// Turn 1 the drawn BA/C goes to (1,0) R0 with a follower on its city (N, towards (1,-1)).
// From then on the palace fits (1,-1) — joining the occupied city — but not (0,-1), whose two
// cities are empty. The pack holds 4 BA/C: 2 preplaced, turn 1, and a last one that `finish()`
// puts at (0,-3), away from the capital's field. The game ends when the pack is empty, palaces
// in hand or not (they are placed instead of drawing).
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { describe, it, expect } from "vitest";
import { setDomParserFactory, type XmlDOMParser } from "../XmlUtils.js";
import { Engine } from "./Engine.js";

setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);

const REPO = process.cwd();
const BASIC_XML = readFileSync(resolve(join(REPO, "xmls", "basic.xml")), "utf8");
const KINGDOMS_XML = readFileSync(resolve(join(REPO, "xmls", "kingdoms.xml")), "utf8");
const tileSet = (count: number, extra = ""): string => `<?xml version="1.0" encoding="utf-8"?>
<defs><sets><tile-set id="one"><ref count="${count}" tile="BA/C" />${extra}</tile-set></sets></defs>`;

type Start = Array<{ tile: string; x: number; y: number; rotation: number }>;
const DEFAULT_START: Start = [
  { tile: "BA/C", x: 0, y: 0, rotation: 0 },
  { tile: "BA/C", x: 0, y: -2, rotation: 180 },
];

type State = Record<string, unknown>;
type Item = { type: string; tileId?: string; options?: Array<{ position: [number, number] }> };
type PointsEntry = {
  player: number;
  points: number;
  name: string;
  items: Array<{ count: number | null; name: string; points: number }>;
  ptr: { featurePointer: unknown; fields: unknown[]; cities: unknown[]; coc?: boolean };
};

class Game {
  private readonly engine = new Engine(() => "");
  readonly setup: State;

  constructor(
    opts: {
      palaces?: number | null;
      playerSlots?: number[];
      players?: number;
      kingdomsSet?: boolean;
      /** preplaced BA/C tiles; the pack holds these + 2 (turn 1 and the last one) */
      start?: Start;
      /** extra BA/C drawn besides turn 1 and the last one */
      extraDraws?: number;
      /** a BA/CFc.1 (city W–E) in the pack, and the forced order the tiles are drawn in */
      cityBridge?: boolean;
      drawOrder?: string[];
      /** Bridges, Castles & Bazaars castles */
      castles?: boolean;
    } = {},
  ) {
    const start = opts.start ?? DEFAULT_START;
    (this.engine as unknown as { tileDefinitions: string[] }).tileDefinitions = [
      BASIC_XML,
      KINGDOMS_XML,
      tileSet(start.length + 2 + (opts.extraDraws ?? 0), opts.cityBridge ? '<ref count="1" tile="BA/CFc.1" />' : ""),
    ];
    this.setup = this.send({
      type: "GAME_SETUP",
      payload: {
        initialRandom: 0.5,
        players: opts.players ?? 1,
        ...(opts.playerSlots ? { playerSlots: opts.playerSlots } : {}),
        gameAnnotations: opts.drawOrder ? { drawOrder: opts.drawOrder } : {},
        // the client selects the (empty) `kingdoms` tile-set with the expansion
        sets: { one: 1, ...(opts.kingdomsSet ? { kingdoms: 1 } : {}) },
        elements: {
          "small-follower": 7,
          ...(opts.palaces === null ? {} : { "kingdom-palace": opts.palaces ?? 1 }),
          ...(opts.castles ? { castle: 3 } : {}),
        },
        rules: {},
        start,
      },
    });
  }

  send(msg: unknown): State {
    return JSON.parse(this.engine.processInput(JSON.stringify(msg))!) as State;
  }

  place(x: number, y: number, tileId: string, rotation = "R0"): State {
    return this.send({ type: "PLACE_TILE", payload: { tileId, rotation, position: [x, y] }, player: 0 });
  }

  deployOnCity(x: number, y: number, location: string, meepleId: string): State {
    return this.send({
      type: "DEPLOY_MEEPLE",
      payload: { pointer: { position: [x, y], location, feature: "City" }, meepleId },
      player: 0,
    });
  }

  pass(): State {
    return this.send({ type: "PASS", payload: {}, player: 0 });
  }

  commit(): State {
    return this.send({ type: "COMMIT", payload: { random: 0.0 }, player: 0 });
  }

  /** Places the last drawn tile out of the way and ends the turn (and so the game). */
  finish(x = 0, y = -3): State {
    return this.endTurn(this.place(x, y, "BA/C"));
  }

  /** Ends the turn without deploying (the action phase is skipped when it has nothing to offer). */
  endTurn(state: State): State {
    if (state.phase === "ActionPhase") this.pass();
    return this.commit();
  }

  /** Places a palace and ends the turn without deploying. */
  placePalace(x: number, y: number, tileId = "Kingdoms/KingdomPalaceRed"): State {
    return this.endTurn(this.place(x, y, tileId));
  }

  /** Turn 1: the drawn BA/C to (1,0) with a follower on its city. */
  occupyCity(): State {
    this.place(1, 0, "BA/C");
    this.deployOnCity(1, 0, "N", "0.small.1");
    return this.commit();
  }
}

function items(state: State): Item[] {
  const action = state.action as { items: Item[] } | null;
  return action === null ? [] : action.items;
}

function palaceItem(state: State): Item | undefined {
  return items(state).find((i) => i.type === "TilePlacement" && i.tileId?.startsWith("Kingdoms/"));
}

function tokens(state: State, player = 0): Record<string, { count: number; tile?: string }> {
  return (state.players as Array<{ tokens: Record<string, { count: number; tile?: string }> }>)[player].tokens;
}

function kingdomScores(state: State): PointsEntry[] {
  const history = state.history as Array<{ events: Array<{ type: string; points?: PointsEntry[] }> }>;
  return history
    .flatMap((t) => t.events)
    .filter((e) => e.type === "points")
    .flatMap((e) => e.points!)
    .filter((p) => p.name === "kingdom");
}

describe("Kingdoms — Kingdom Palace", () => {
  it("gives each player the palace of their slot's colour, as many as the element says", () => {
    const game = new Game({ players: 2, playerSlots: [3, 0], palaces: 2 });
    expect(tokens(game.setup, 0).KINGDOM_PALACE).toEqual({ count: 2, tile: "Kingdoms/KingdomPalaceGreen" });
    expect(tokens(game.setup, 1).KINGDOM_PALACE).toEqual({ count: 2, tile: "Kingdoms/KingdomPalaceRed" });
  });

  it("falls back to slot = player index without playerSlots", () => {
    const game = new Game({ players: 2 });
    expect(tokens(game.setup, 0).KINGDOM_PALACE.tile).toBe("Kingdoms/KingdomPalaceRed");
    expect(tokens(game.setup, 1).KINGDOM_PALACE.tile).toBe("Kingdoms/KingdomPalaceBlue");
  });

  it("is never drawn — the palaces are not in the tile pack", () => {
    const game = new Game();
    expect((game.setup.tilePack as { size: number }).size).toBe(1); // 4 BA/C: 2 preplaced, 1 drawn
    expect(new Game({ palaces: null }).setup.players).toBeDefined(); // the XML loads harmlessly without the element
  });

  it("the Kingdoms expansion's tile-set is empty — selecting it adds no tile to the pack", () => {
    const game = new Game({ kingdomsSet: true });
    expect((game.setup.tilePack as { size: number }).size).toBe(1);
    expect(tokens(game.setup).KINGDOM_PALACE.count).toBe(1);
  });

  it("is not offered while no city holds the player's follower", () => {
    const game = new Game();
    expect(palaceItem(game.setup)).toBeUndefined();
    expect(game.setup.phase).toBe("TilePhase");
  });

  it("is offered only where it joins a city occupied by the active player", () => {
    const game = new Game();
    const state = game.occupyCity();
    const item = palaceItem(state)!;
    expect(item.tileId).toBe("Kingdoms/KingdomPalaceRed");
    // (1,-1) joins the occupied city; (0,-1) would join only the two empty cities
    expect(item.options!.map((o) => o.position)).toEqual([[1, -1]]);
    expect((state.action as { canPass: boolean }).canPass).toBe(true);
  });

  it("can be passed: the player then draws normally", () => {
    const game = new Game({ palaces: 1 });
    game.occupyCity();
    expect(game.pass().phase).toBe("CommitAbbeyPassPhase");
    expect(game.commit().phase).toBe("TilePhase");
    const state = game.finish();
    expect(state.phase).toBe("GameOverPhase");
    expect(tokens(state).KINGDOM_PALACE.count).toBe(1);
    expect(kingdomScores(state)).toHaveLength(0);
  });

  it("placing it uses up the token and is followed by the action phase", () => {
    const game = new Game();
    game.occupyCity();
    const state = game.place(1, -1, "Kingdoms/KingdomPalaceRed");
    // the action phase ran (here with nothing to deploy: the capital is already occupied)
    expect(state.phase).toMatch(/ActionPhase$/);
    expect(tokens(state).KINGDOM_PALACE?.count ?? 0).toBe(0); // an exhausted token leaves the map
    const placed = (state.placedTiles as Array<{ id: string; position: [number, number] }>).find(
      (t) => t.id === "Kingdoms/KingdomPalaceRed",
    );
    expect(placed?.position).toEqual([1, -1]);
  });

  it("rejects a placement that joins no city of the player", () => {
    const game = new Game();
    game.occupyCity();
    expect(() => game.place(0, -1, "Kingdoms/KingdomPalaceRed")).toThrow();
  });

  it("an unfinished capital scores no kingdom", () => {
    const game = new Game();
    game.occupyCity();
    game.placePalace(1, -1); // the capital (1,0)+(1,-1) stays open
    const state = game.finish(); // no tiles left → game over → final scoring
    expect(state.phase).toBe("GameOverPhase");
    expect(kingdomScores(state)).toHaveLength(0);
    // only the incomplete capital itself: 2 tiles = 2
    expect((state.players as Array<{ points: number }>)[0].points).toBe(2);
  });

  // The palace closes a city on all four sides. Preplaced BA/C, each with its one city edge facing
  // the palace spot (0,0): (0,-1) R180, (-1,0) R90, (0,1) R0; (2,0) R0 only makes (1,0) reachable.
  // Turn 1 the drawn BA/C goes to (1,0) R270 (city W, towards (0,0)) with the follower.
  const CLOSING: Start = [
    { tile: "BA/C", x: 0, y: -1, rotation: 180 },
    { tile: "BA/C", x: -1, y: 0, rotation: 90 },
    { tile: "BA/C", x: 0, y: 1, rotation: 0 },
    { tile: "BA/C", x: 2, y: 0, rotation: 0 },
  ];

  it("a completed capital scores its kingdom — every COMPLETED city touching its fields", () => {
    const game = new Game({ start: CLOSING });
    game.place(1, 0, "BA/C", "R270");
    game.deployOnCity(1, 0, "W", "0.small.1");
    game.commit();
    game.placePalace(0, 0); // completes the capital: palace + 4 one-edge cities
    const state = game.finish(3, 0); // last tile beside (2,0): its field joins the capital's field

    const scores = kingdomScores(state);
    expect(scores).toHaveLength(1);
    const [k] = scores;
    expect(k.player).toBe(0);
    // the field of (1,0)+(2,0)+(3,0) also touches the cities of (2,0) and (3,0), but they are
    // unfinished and don't count; the other three fields touch only the capital
    expect(k.items).toEqual([{ count: 1, name: "cities", points: 3 }]);
    expect(k.ptr.fields).toHaveLength(4);
    expect(k.ptr.cities).toHaveLength(1);
  });

  // Two palace spots, (0,0) and (2,0), each closed by one-edge cities except towards the gap (1,0).
  // Turn 1 puts a follower next to (0,0), turn 3 one next to (2,0); a BA/CFc.1 (city W–E) drawn
  // last fills the gap and joins both capitals into one completed city.
  const TWO_CAPITALS: Start = [
    { tile: "BA/C", x: 0, y: -1, rotation: 180 },
    { tile: "BA/C", x: -1, y: 0, rotation: 90 },
    { tile: "BA/C", x: -1, y: 1, rotation: 0 }, // only makes (0,1) reachable
    { tile: "BA/C", x: 2, y: -1, rotation: 180 },
    { tile: "BA/C", x: 3, y: 0, rotation: 270 },
    { tile: "BA/C", x: 3, y: 1, rotation: 0 }, // only makes (2,1) reachable
  ];

  const twoCapitals = (): Game =>
    new Game({
      palaces: 2,
      start: TWO_CAPITALS,
      cityBridge: true,
      drawOrder: ["BA/C", "BA/C", "BA/CFc.1"],
    });

  it("a castle touching the capital's fields counts as one city", () => {
    // CLOSING board; turn 3 closes the 2-tile city of (2,0) with (2,-1) and turns it into a castle.
    // The field of (1,0)+(2,0) touches both the capital and that castle.
    const game = new Game({ start: CLOSING, castles: true, extraDraws: 1 });
    game.place(1, 0, "BA/C", "R270");
    game.deployOnCity(1, 0, "W", "0.small.1");
    game.commit();
    game.placePalace(0, 0); // completes the capital
    game.place(2, -1, "BA/C", "R180"); // city S onto (2,0)'s city N: a completed 2-tile city
    game.deployOnCity(2, -1, "S", "0.small.2");
    let state = game.send({
      type: "PLACE_TOKEN",
      payload: { token: "CASTLE", pointer: { position: [2, -1], location: "S", feature: "City" } },
      player: 0,
    });
    expect((state.features as Array<{ type: string }>).some((f) => f.type === "Castle")).toBe(true);
    state = game.endTurn(state);
    state = game.finish(3, 0);

    const scores = kingdomScores(state);
    expect(scores).toHaveLength(1);
    expect(scores[0].items).toEqual([
      { count: 1, name: "cities", points: 3 },
      { count: 1, name: "castles", points: 3 },
    ]);
    expect(scores[0].points).toBe(6);
    expect(scores[0].ptr.cities).toHaveLength(2);
  });

  it("is never placed into a city that already holds a palace", () => {
    const game = twoCapitals();
    game.place(0, 1, "BA/C");
    game.deployOnCity(0, 1, "N", "0.small.1");
    game.commit();
    const state = game.placePalace(0, 0); // capital A, still open towards (1,0)
    // the only city with the player's follower is now capital A: its open side (1,0) is refused,
    // so no palace is offered at all
    expect(palaceItem(state)).toBeUndefined();
    expect(state.phase).toBe("TilePhase");
    expect(tokens(state).KINGDOM_PALACE.count).toBe(1); // still in hand
  });

  it("capitals joined later score once per player", () => {
    const game = twoCapitals();
    game.place(0, 1, "BA/C");
    game.deployOnCity(0, 1, "N", "0.small.1");
    game.commit();
    game.placePalace(0, 0); // capital A
    game.place(2, 1, "BA/C");
    game.deployOnCity(2, 1, "N", "0.small.2");
    game.commit();
    const before = game.placePalace(2, 0); // capital B — a separate city, so it is allowed
    expect(tokens(before).KINGDOM_PALACE?.count ?? 0).toBe(0);
    // the last tile, a city W–E, joins A and B into one completed city with two palaces
    const state = game.endTurn(game.place(1, 0, "BA/CFc.1"));
    expect(state.phase).toBe("GameOverPhase");

    const scores = kingdomScores(state);
    expect(scores).toHaveLength(1);
    expect(scores[0].player).toBe(0);
  });

  it("does nothing without the element", () => {
    const game = new Game({ palaces: null });
    expect(tokens(game.setup).KINGDOM_PALACE).toBeUndefined();
  });
});
