// Bards of Carcassonne — checked against the rules on
// wikicarpedia.com/car/Bards_of_Carcassonne_(Fan_Expansion) (copy: EngineToTS/bards-rules.txt).
// The pack holds only the 7 Lute tiles (plus the start tile), so every draw is a Lute tile.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { describe, it, expect } from "vitest";
import { setDomParserFactory, type XmlDOMParser } from "../../XmlUtils.js";
import { Engine } from "../../engine/Engine.js";
import { City } from "../../feature/City.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { GameState } from "../state/GameState.js";
import { BardsLuteCapability, type BardsLuteModel } from "./BardsLuteCapability.js";

setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);

const REPO = process.cwd();
type Ptr = { position: [number, number]; feature: string; location: string };
type State = {
  phase: string;
  action: { items: Array<{ type: string; tileId?: string; options?: Array<Record<string, unknown>> }> };
  tokens?: { BARDS_NOTE?: Ptr[] };
};

function newGame(rules: Record<string, unknown> = {}, onlyLuteTile: string | null = null) {
  const engine = new Engine((p) => readFileSync(p, "utf8"));
  engine.processInput("%load " + resolve(join(REPO, "xmls/basic.xml")));
  engine.processInput("%load " + resolve(join(REPO, "xmls/bards-of-carcassonne.xml")));
  // only the start tile of the base game: every draw is a Lute tile
  const basicTiles = [...readFileSync(join(REPO, "xmls/basic.xml"), "utf8").matchAll(/<ref[^>]*tile="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((id) => id !== "BA/RCr");
  // optionally a single Lute tile in the pack (and only the start tile's own copy of BA/RCr)
  const luteOff = onlyLuteTile === null
    ? []
    : [...readFileSync(join(REPO, "xmls/bards-of-carcassonne.xml"), "utf8").matchAll(/<ref[^>]*tile="([^"]+)"/g)]
        .map((m) => m[1])
        .filter((id) => id !== onlyLuteTile);
  const send = (msg: unknown): State => JSON.parse(engine.processInput(JSON.stringify(msg))!) as State;
  const s0 = send({
    type: "GAME_SETUP",
    payload: {
      sets: { "basic:1": 1, "bards-of-carcassonne": 1 },
      tiles: Object.fromEntries([
        ...basicTiles.map((id) => [id, 0]),
        ...luteOff.map((id) => [id, 0]),
        ...(onlyLuteTile === null ? [] : [["BA/RCr", 1]]),
      ]),
      elements: { "small-follower": 7, farmers: true, "bards-lute": true },
      rules: { "inn-and-cathedral-final-scoring": "zero", ...rules },
      start: [{ tile: "BA/RCr", x: 0, y: 0, rotation: 0 }],
      players: 2,
      initialRandom: 0.3,
      gameAnnotations: null,
    },
  });
  return { engine, send, s0 };
}

/** Place the drawn Lute tile on its first legal spot; returns the state in BardsLutePhase. */
function placeLuteTile(send: (m: unknown) => State, s: State): State {
  const tp = s.action.items.find((i) => i.type === "TilePlacement")!;
  const opt = tp.options![0] as { position: [number, number]; rotations: number[] };
  return send({
    type: "PLACE_TILE",
    payload: { tileId: tp.tileId, rotation: "R" + opt.rotations[0], position: opt.position },
  });
}

describe("Bards of Carcassonne", () => {
  it("a note must go on an unoccupied feature of the Lute tile just placed — nowhere else", () => {
    const { send, s0 } = newGame();
    const s1 = placeLuteTile(send, s0);
    expect(s1.phase).toBe("BardsLutePhase");
    const item = s1.action.items.find((i) => i.type === "BardsLute")!;
    const options = item.options as unknown as Ptr[];
    expect(options.length).toBeGreaterThan(0);
    // every option lies on the Lute tile just placed
    const lutePos = options[0].position;
    expect(options.every((o) => o.position[0] === lutePos[0] && o.position[1] === lutePos[1])).toBe(true);
    // a feature of another tile (the start tile's city) is refused
    expect(() =>
      send({ type: "PLACE_TOKEN", payload: { token: "BARDS_NOTE", pointer: { position: [0, 0], feature: "City", location: "N" } } }),
    ).toThrow(/Invalid Bards' note placement/);
    // the note is mandatory: no pass
    expect(() => send({ type: "PASS", payload: {} })).toThrow();
  });

  it("no meeple on the feature that got the note this turn", () => {
    const { send, s0 } = newGame();
    const s1 = placeLuteTile(send, s0);
    const note = (s1.action.items.find((i) => i.type === "BardsLute")!.options as unknown as Ptr[])[0];
    const s2 = send({ type: "PLACE_TOKEN", payload: { token: "BARDS_NOTE", pointer: note } });
    expect(s2.phase).toBe("ActionPhase");
    expect(s2.tokens?.BARDS_NOTE).toEqual([note]);
    const meepleOptions = s2.action.items.flatMap((i) => (i.options ?? []) as unknown as Ptr[]);
    expect(
      meepleOptions.some(
        (o) => o.position[0] === note.position[0] && o.position[1] === note.position[1] && o.location === note.location,
      ),
    ).toBe(false);
  });

  // scoring is checked on the city the note went on: +1 per tile; advanced variant: per note;
  // unfinished with a note: nothing
  function noteOnCity(rules: Record<string, unknown> = {}) {
    const { engine, send, s0 } = newGame(rules);
    const s1 = placeLuteTile(send, s0);
    const options = s1.action.items.find((i) => i.type === "BardsLute")!.options as unknown as Ptr[];
    const cityNote = options.find((o) => o.feature === "City");
    expect(cityNote).toBeDefined();
    send({ type: "PLACE_TOKEN", payload: { token: "BARDS_NOTE", pointer: cityNote } });
    const state = engine.getGame()!.getState() as GameState;
    const fp = [...BardsLuteCapability.getNotes(state)][0];
    const city = state.getFeature(fp) as City;
    expect(city).toBeInstanceOf(City);
    return { state, city, fp };
  }

  const bardItem = (expr: { getItems(): Iterable<{ getName(): string; getPoints(): number }> }) =>
    [...expr.getItems()].find((i) => i.getName() === "bardsnotes");

  it("a completed city with a note: +1 per tile", () => {
    const { state, city } = noteOnCity();
    const tiles = city.getTilePositions().size();
    expect(bardItem(city.getStructurePoints(state, true))!.getPoints()).toBe(tiles);
  });

  it("an unfinished city with a note scores nothing", () => {
    const { state, city } = noteOnCity();
    const expr = city.getStructurePoints(state, false);
    expect(expr.getPoints()).toBe(0);
    expect(bardItem(expr)).toBeDefined();
  });

  it("two notes: basic +1 per tile once, advanced variant +1 per tile per note", () => {
    for (const [rules, factor] of [[{}, 1], [{ "bards-notes-stack": true }, 2]] as const) {
      const { state, city, fp } = noteOnCity(rules);
      // a second note elsewhere on the same city (another of its places)
      const other = [...city.getPlaces()].find((p) => !p.equals(fp))!;
      const withTwo = state.mapCapabilityModel<BardsLuteModel>(BardsLuteCapability as never, (n) => n.add(other as FeaturePointer));
      const c2 = withTwo.getFeature(fp) as City;
      const tiles = c2.getTilePositions().size();
      expect(bardItem(c2.getStructurePoints(withTwo, true))!.getPoints()).toBe(tiles * factor);
    }
  });

  it("notes stay on the board for the whole game — also after their feature is scored", () => {
    // rc.l north of the start tile, turned so its city cap faces south: closes the start city
    const { send } = newGame({}, "bards-of-carcassonne/rc.l");
    const s1 = send({ type: "PLACE_TILE", payload: { tileId: "bards-of-carcassonne/rc.l", rotation: "R180", position: [0, -1] } });
    expect(s1.phase).toBe("BardsLutePhase");
    const cityNote = (s1.action.items.find((i) => i.type === "BardsLute")!.options as unknown as Ptr[]).find((o) => o.feature === "City")!;
    const s2 = send({ type: "PLACE_TOKEN", payload: { token: "BARDS_NOTE", pointer: cityNote } });
    expect(s2.tokens?.BARDS_NOTE).toEqual([cityNote]);
    send({ type: "PASS", payload: {} });
    const s3 = send({ type: "COMMIT", payload: { random: 0.5 } });
    expect(s3.tokens?.BARDS_NOTE).toEqual([cityNote]);
  });
});
