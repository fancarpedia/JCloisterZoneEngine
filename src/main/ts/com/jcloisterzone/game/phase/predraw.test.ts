// Engine-side pre-draw placement path. There is no Java golden for pre-draw (it is server-
// authoritative and never sent to the jar), so this verifies the engine piece directly: with the
// `pre-draw` element the turn-part phase offers an opaque "PreDrawPlace" action (the secret hand
// lives server-side), and a PLACE_PREDRAWN reveal draws the named tile from the pack, validates the
// placement, and advances to the action phase.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { describe, it, expect } from "vitest";
import { setDomParserFactory, type XmlDOMParser } from "../../XmlUtils.js";
import { Engine } from "../../engine/Engine.js";

setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);

const REPO = process.cwd();

describe("pre-draw placement (engine)", () => {
  it("offers PreDrawPlace and places a revealed hand tile", () => {
    const engine = new Engine((p) => readFileSync(p, "utf8"));
    engine.processInput("%load " + resolve(join(REPO, "xmls/basic.xml")));

    const afterSetup = engine.processInput(
      JSON.stringify({
        type: "GAME_SETUP",
        payload: {
          sets: { "basic:1": 1 },
          elements: { "small-follower": 7, farmers: true, "pre-draw": 3 },
          rules: {},
          start: [{ tile: "BA/RCr", x: 0, y: 0, rotation: 0 }],
          players: 2,
          initialRandom: 0.0,
          gameAnnotations: null,
        },
      }),
    );
    expect(afterSetup).not.toBeNull();
    const s0 = JSON.parse(afterSetup!) as {
      phase: string;
      action: { canPass: boolean; items: Array<{ type: string }> };
    };
    // Turn-part start: pre-draw is active, so the engine waits for a hand placement (no public draw).
    expect(s0.phase).toBe("TileFromSupplyPhase");
    expect(s0.action.items.some((i) => i.type === "PreDrawPlace")).toBe(true);
    expect(s0.action.canPass).toBe(false);

    // Reveal + place a tile from the (server-secret) hand. BA/RCr at [1,0] R0 is a legal neighbour
    // of the start tile (same placement the abbey-merge fixture uses).
    const afterPlace = engine.processInput(
      JSON.stringify({
        type: "PLACE_PREDRAWN",
        payload: { tileId: "BA/RCr", rotation: "R0", position: [1, 0] },
      }),
    );
    expect(afterPlace).not.toBeNull();
    const s1 = JSON.parse(afterPlace!) as {
      phase: string;
      placedTiles: Array<{ position: [number, number]; id: string }>;
      undo: { allowed: boolean };
    };
    // The revealed tile is on the board and play advanced to the action phase.
    expect(s1.placedTiles.some((t) => t.id === "BA/RCr" && t.position[0] === 1 && t.position[1] === 0)).toBe(true);
    expect(s1.phase).toBe("ActionPhase");
    // Placing a pre-drawn tile IS undoable (the player may re-choose which tile to place).
    expect(s1.undo.allowed).toBe(true);
  });

  it("answers a %placements query without mutating state", () => {
    const engine = new Engine((p) => readFileSync(p, "utf8"));
    engine.processInput("%load " + resolve(join(REPO, "xmls/basic.xml")));
    engine.processInput(
      JSON.stringify({
        type: "GAME_SETUP",
        payload: {
          sets: { "basic:1": 1 },
          elements: { "small-follower": 7, farmers: true, "pre-draw": 3 },
          rules: {},
          start: [{ tile: "BA/RCr", x: 0, y: 0, rotation: 0 }],
          players: 2,
          initialRandom: 0.0,
          gameAnnotations: null,
        },
      }),
    );

    // The client asks for legal placements of a secret hand tile (the tile is in the public pack).
    const placementsOut = engine.processInput("%placements BA/RCr");
    expect(placementsOut).not.toBeNull();
    const pl = JSON.parse(placementsOut!) as {
      type: string;
      tileId: string;
      options: Array<{ position: [number, number]; rotations: number[] }>;
    };
    expect(pl.type).toBe("PLACEMENTS");
    expect(pl.tileId).toBe("BA/RCr");
    // [1,0] (a neighbour of the start tile) must be an offered position.
    expect(pl.options.some((o) => o.position[0] === 1 && o.position[1] === 0)).toBe(true);

    // The query did not consume the tile: a subsequent reveal+place of the SAME id still works.
    const afterPlace = engine.processInput(
      JSON.stringify({ type: "PLACE_PREDRAWN", payload: { tileId: "BA/RCr", rotation: "R0", position: [1, 0] } }),
    );
    const s1 = JSON.parse(afterPlace!) as { phase: string; placedTiles: Array<{ id: string }> };
    expect(s1.placedTiles.some((t) => t.id === "BA/RCr")).toBe(true);
    expect(s1.phase).toBe("ActionPhase");
  });

  it("rejects an illegal pre-drawn placement", () => {
    const engine = new Engine((p) => readFileSync(p, "utf8"));
    engine.processInput("%load " + resolve(join(REPO, "xmls/basic.xml")));
    engine.processInput(
      JSON.stringify({
        type: "GAME_SETUP",
        payload: {
          sets: { "basic:1": 1 },
          elements: { "small-follower": 7, farmers: true, "pre-draw": 3 },
          rules: {},
          start: [{ tile: "BA/RCr", x: 0, y: 0, rotation: 0 }],
          players: 2,
          initialRandom: 0.0,
          gameAnnotations: null,
        },
      }),
    );
    // [0,5] is not adjacent to any tile → no legal placement → engine refuses.
    expect(() =>
      engine.processInput(
        JSON.stringify({ type: "PLACE_PREDRAWN", payload: { tileId: "BA/RCr", rotation: "R0", position: [0, 5] } }),
      ),
    ).toThrow();
  });
});

// "Rotate the placed tile" must work in a pre-draw game too. It nearly did not: the hand is
// secret, so the engine offers an opaque PreDrawPlace instead of a TilePlacementAction listing
// the legal angles, and the placement arrives as PLACE_PREDRAWN rather than PLACE_TILE. Both
// assumptions had to go - and the re-placement has to stay PLACE_PREDRAWN, or the tile would be
// taken down the public-draw path instead of being drawn from the pack by id.
describe("rotating a tile placed from a pre-draw hand", () => {
  type State = {
    phase: string;
    undo: { allowed: boolean; depth: number };
    placedTiles: { position: [number, number]; rotation: number; id: string }[];
    tileRotation?: { position: [number, number]; rotation: number; rotations: number[]; tileId: string };
  };

  const start = () => {
    const engine = new Engine((p) => readFileSync(p, "utf8"));
    engine.processInput("%load " + resolve(join(REPO, "xmls/basic.xml")));
    engine.processInput(
      JSON.stringify({
        type: "GAME_SETUP",
        payload: {
          sets: { "basic:1": 1 },
          elements: { "small-follower": 7, farmers: true, "pre-draw": 3 },
          rules: {},
          start: [{ tile: "BA/RCr", x: 0, y: 0, rotation: 0 }],
          players: 2,
          initialRandom: 0.0,
          gameAnnotations: null,
        },
      }),
    );
    return engine;
  };

  const send = (engine: Engine, type: string, payload: Record<string, unknown>) =>
    JSON.parse(engine.processInput(JSON.stringify({ type, payload }))!) as State;

  // BA/RrC at [1,0] is a road+city tile with more than one legal angle beside the start tile
  const place = (engine: Engine) =>
    send(engine, "PLACE_PREDRAWN", { tileId: "BA/RrC", rotation: "R90", position: [1, 0] });

  it("offers the rotation after a hand tile is placed", () => {
    const s = place(start());
    expect(s.tileRotation, JSON.stringify(s.placedTiles)).toBeDefined();
    expect(s.tileRotation!.tileId).toBe("BA/RrC");
    expect(s.tileRotation!.rotations.length).toBeGreaterThan(1);
  });

  it("turns the tile where it lies, leaving it on the board", () => {
    const engine = start();
    const placed = place(engine);
    const before = placed.placedTiles.length;
    const target = placed.tileRotation!.rotations.find(r => r !== placed.tileRotation!.rotation)!;

    const s = send(engine, "ROTATE_TILE", { rotation: "R" + target });
    expect(s.placedTiles.length).toBe(before);
    const tile = s.placedTiles.find(t => t.position[0] === 1 && t.position[1] === 0)!;
    expect(tile.id).toBe("BA/RrC");
    expect(tile.rotation).toBe(target);
  });

  it("still costs one undo step per rotation", () => {
    const engine = start();
    const placed = place(engine);
    expect(placed.undo.depth).toBe(1);
    const target = placed.tileRotation!.rotations.find(r => r !== placed.tileRotation!.rotation)!;
    expect(send(engine, "ROTATE_TILE", { rotation: "R" + target }).undo.depth).toBe(2);
  });

  it("picks the next angle on its own, with no rotation given", () => {
    const engine = start();
    const placed = place(engine);
    const s = send(engine, "ROTATE_TILE", {});
    const tile = s.placedTiles.find(t => t.position[0] === 1 && t.position[1] === 0)!;
    expect(tile.rotation).not.toBe(placed.tileRotation!.rotation);
    expect(placed.tileRotation!.rotations).toContain(tile.rotation);
  });

  it("does not put the tile back in the pack or draw another", () => {
    // a PLACE_TILE re-placement would take the public-draw path; the board must still hold
    // exactly the start tile plus this one
    const engine = start();
    place(engine);
    send(engine, "ROTATE_TILE", {});
    const s = send(engine, "ROTATE_TILE", {});
    expect(s.placedTiles.length).toBe(2);
    expect(s.placedTiles.filter(t => t.id === "BA/RrC")).toHaveLength(1);
  });
});
