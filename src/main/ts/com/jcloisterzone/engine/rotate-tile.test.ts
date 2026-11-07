// ROTATE_TILE — turn the tile that is already on the board.
//
// The contract pinned here is the undo arithmetic: each rotation costs ONE undo step of its own,
// so after place + rotate + rotate it takes three UNDOs to get back to choosing a position (undo
// walks back through the angles first, and only the last one lifts the tile). That is what makes
// a rotation feel like an action the player took rather than a silent rewrite of the placement.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { describe, it, expect, beforeEach } from "vitest";
import { setDomParserFactory, type XmlDOMParser } from "../XmlUtils.js";
import { Engine } from "./Engine.js";

setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);

const REPO = process.cwd();
const BASIC_XML = readFileSync(resolve(join(REPO, "xmls", "basic.xml")), "utf8");

type State = {
  phase: string;
  undo: { allowed: boolean; depth: number };
  placedTiles: { position: [number, number]; rotation: number; id: string }[];
  flags: Record<string, boolean>;
  tileRotation?: { position: [number, number]; rotation: number; rotations: number[]; tileId: string };
  action?: { items: { tileId: string; options: { position: [number, number]; rotations: number[] }[] }[] };
};

let engine: Engine;

const send = (type: string, payload: Record<string, unknown>): State =>
  JSON.parse(engine.processInput(JSON.stringify({ type, payload }))!) as State;

const setup = (): State => {
  engine = new Engine(() => "");
  (engine as unknown as { tileDefinitions: string[] }).tileDefinitions = [BASIC_XML];
  return send("GAME_SETUP", {
    initialRandom: 0.5191767944266055,
    players: 2,
    gameAnnotations: {},
    sets: { "basic:1": 1 },
    elements: { "small-follower": 7, farmers: true },
    rules: { "tiny-city-scoring": "4" },
    start: [{ tile: "BA/RCr", x: 0, y: 0, rotation: 0 }],
  });
};

/** The tile the active player is being asked to place, and where it may go. */
const placementOption = (state: State) => {
  const item = state.action!.items[0];
  return { tileId: item.tileId, ...item.options[0] };
};

const placed = (s: State) => s.placedTiles[s.placedTiles.length - 1];

describe("ROTATE_TILE", () => {
  let start: State;
  beforeEach(() => { start = setup(); });

  it("turns the tile where it lies, without taking it off the board", () => {
    const opt = placementOption(start);
    const [a, b] = opt.rotations;
    const afterPlace = send("PLACE_TILE", { tileId: opt.tileId, rotation: "R" + a, position: opt.position });
    const tiles = afterPlace.placedTiles.length;

    const afterRotate = send("ROTATE_TILE", { rotation: "R" + b });
    expect(afterRotate.placedTiles.length).toBe(tiles);
    expect(placed(afterRotate).position).toEqual(opt.position);
    expect(placed(afterRotate).rotation).toBe(b);
    expect(placed(afterRotate).id).toBe(placed(afterPlace).id);
  });

  it("costs one undo step per rotation", () => {
    const opt = placementOption(start);
    const [a, b] = opt.rotations;
    expect(send("PLACE_TILE", { tileId: opt.tileId, rotation: "R" + a, position: opt.position }).undo.depth).toBe(1);
    expect(send("ROTATE_TILE", { rotation: "R" + b }).undo.depth).toBe(2);
    expect(send("ROTATE_TILE", { rotation: "R" + a }).undo.depth).toBe(3);
  });

  it("undo walks back through the angles, then lifts the tile", () => {
    const opt = placementOption(start);
    const [a, b] = opt.rotations;
    const placePhase = start.phase;
    send("PLACE_TILE", { tileId: opt.tileId, rotation: "R" + a, position: opt.position });
    send("ROTATE_TILE", { rotation: "R" + b });
    send("ROTATE_TILE", { rotation: "R" + a });

    const first = send("UNDO", {});
    expect(placed(first).rotation).toBe(b);

    const second = send("UNDO", {});
    expect(placed(second).rotation).toBe(a);

    const third = send("UNDO", {});
    expect(third.placedTiles.find(t => t.position[0] === opt.position[0] && t.position[1] === opt.position[1])).toBeUndefined();
    expect(third.phase).toBe(placePhase);
  });

  it("can be rotated back to where it started", () => {
    const opt = placementOption(start);
    const [a, b] = opt.rotations;
    send("PLACE_TILE", { tileId: opt.tileId, rotation: "R" + a, position: opt.position });
    send("ROTATE_TILE", { rotation: "R" + b });
    expect(placed(send("ROTATE_TILE", { rotation: "R" + a })).rotation).toBe(a);
  });

  it("is refused when nothing has been placed", () => {
    const res = JSON.parse(engine.processInput(JSON.stringify({ type: "ROTATE_TILE", payload: { rotation: "R90" } }))!);
    expect(res.type).toBe("ERROR");
  });

  it("is refused once the placement is no longer the last move", () => {
    const opt = placementOption(start);
    send("PLACE_TILE", { tileId: opt.tileId, rotation: "R" + opt.rotations[0], position: opt.position });
    // any further move puts something else on top of the placement
    send("PASS", {});
    const res = JSON.parse(engine.processInput(JSON.stringify({ type: "ROTATE_TILE", payload: { rotation: "R90" } }))!);
    expect(res.type).toBe("ERROR");
  });
});

// The client keeps NO memory of the placement: it offers the action purely because the engine
// says so in `tileRotation`. That is what makes the option survive a reload, a reconnect, or a
// game opened from a save - all of which rebuild the client from engine state alone.
describe("the tileRotation the engine publishes", () => {
  let start: State;
  beforeEach(() => { start = setup(); });

  it("is absent before anything is placed", () => {
    expect(start.tileRotation).toBeUndefined();
  });

  it("appears once the tile is down, with the angles that square allows", () => {
    const opt = placementOption(start);
    const s = send("PLACE_TILE", { tileId: opt.tileId, rotation: "R" + opt.rotations[0], position: opt.position });
    expect(s.tileRotation).toBeDefined();
    expect(s.tileRotation!.position).toEqual(opt.position);
    expect(s.tileRotation!.tileId).toBe(opt.tileId);
    expect(s.tileRotation!.rotation).toBe(opt.rotations[0]);
    expect(s.tileRotation!.rotations).toEqual([...opt.rotations].sort((a, b) => a - b));
  });

  it("follows the tile as it is turned", () => {
    const opt = placementOption(start);
    send("PLACE_TILE", { tileId: opt.tileId, rotation: "R" + opt.rotations[0], position: opt.position });
    const s = send("ROTATE_TILE", { rotation: "R" + opt.rotations[1] });
    expect(s.tileRotation!.rotation).toBe(opt.rotations[1]);
  });

  it("goes away once the placement is no longer the last move", () => {
    const opt = placementOption(start);
    send("PLACE_TILE", { tileId: opt.tileId, rotation: "R" + opt.rotations[0], position: opt.position });
    expect(send("PASS", {}).tileRotation).toBeUndefined();
  });

  it("comes back when an undo returns to the placed tile", () => {
    const opt = placementOption(start);
    send("PLACE_TILE", { tileId: opt.tileId, rotation: "R" + opt.rotations[0], position: opt.position });
    send("ROTATE_TILE", { rotation: "R" + opt.rotations[1] });
    const s = send("UNDO", {});
    expect(s.tileRotation).toBeDefined();
    expect(s.tileRotation!.rotation).toBe(opt.rotations[0]);
  });
});

describe("ROTATE_TILE without an explicit angle", () => {
  let start: State;
  beforeEach(() => { start = setup(); });

  it("moves to the next legal angle", () => {
    const opt = placementOption(start);
    const rots = [...opt.rotations].sort((a, b) => a - b);
    send("PLACE_TILE", { tileId: opt.tileId, rotation: "R" + rots[0], position: opt.position });
    expect(placed(send("ROTATE_TILE", {})).rotation).toBe(rots[1]);
  });

  it("wraps round to the first", () => {
    const opt = placementOption(start);
    // the engine reports the angles ascending, which is the order a press steps through
    const rots = [...opt.rotations].sort((a, b) => a - b);
    send("PLACE_TILE", { tileId: opt.tileId, rotation: "R" + rots[0], position: opt.position });
    for (let i = 1; i < rots.length; i++) send("ROTATE_TILE", {});
    expect(placed(send("ROTATE_TILE", {})).rotation).toBe(rots[0]);
  });

  it("refuses an angle the square does not allow", () => {
    const opt = placementOption(start);
    send("PLACE_TILE", { tileId: opt.tileId, rotation: "R" + opt.rotations[0], position: opt.position });
    const illegal = [0, 90, 180, 270].find(r => !opt.rotations.includes(r));
    if (illegal === undefined) return; // this square happens to allow all four
    const res = JSON.parse(engine.processInput(JSON.stringify({ type: "ROTATE_TILE", payload: { rotation: "R" + illegal } }))!);
    expect(res.type).toBe("ERROR");
  });
});
