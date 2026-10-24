import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { describe, it, expect } from "vitest";
import { setDomParserFactory, type XmlDOMParser } from "../XmlUtils.js";
import type { GameState } from "../game/state/GameState.js";
import type { PlayerAction } from "../action/PlayerAction.js";
import { StateGsonBuilder } from "./StateGsonBuilder.js";
import { GameStateBuilder } from "../game/state/GameStateBuilder.js";
import { GameStatePhaseReducer } from "../game/GameStatePhaseReducer.js";
import { GameSetupMessage } from "../io/message/GameSetupMessage.js";
import { MessageParser } from "../io/MessageParser.js";
import { createSetupFromMessage } from "./EngineSetup.js";

setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);

const REPO = process.cwd();
const TESTS_ROOT = join(REPO, "engine-tests");
const XMLS_DIR = join(REPO, "xmls");

/** All non-addon .jcz files whose set XMLs are present, grouped by directory. */
function discover(): Array<{ dir: string; file: string }> {
  const out: Array<{ dir: string; file: string }> = [];
  for (const dir of readdirSync(TESTS_ROOT)) {
    const dirPath = join(TESTS_ROOT, dir);
    if (!statSync(dirPath).isDirectory()) continue;
    for (const file of readdirSync(dirPath)) {
      if (file.endsWith(".jcz")) out.push({ dir, file });
    }
  }
  return out;
}

function xmlFilesExist(sets: Record<string, number>): boolean {
  for (const key of Object.keys(sets)) {
    if (!existsSync(join(XMLS_DIR, key.split(":")[0].split("/")[0].replace(/-/g, "_") + ".xml"))) return false;
  }
  return true;
}

interface Jcz {
  initialRandom: number;
  test: { description: string; assertions: string[] };
  setup: {
    addons?: unknown;
    sets: Record<string, number>;
    tiles?: Record<string, number> | null;
    elements: Record<string, unknown>;
    rules: Record<string, unknown>;
    start: Array<{ tile: string; x: number; y: number; rotation: number }>;
  };
  players: Array<{ name: string; slot: number }>;
  replay: Array<{ type: string; payload: Record<string, unknown> }>;
  gameAnnotations?: Record<string, unknown> | null;
}

function loadXmlsForSets(sets: Record<string, number>): string[] {
  const files = new Set<string>();
  for (const key of Object.keys(sets)) {
    files.add(key.split(":")[0].split("/")[0].replace(/-/g, "_") + ".xml");
  }
  return [...files].map((f) => readFileSync(join(XMLS_DIR, f), "utf8"));
}

// The frontend expands selected sets into GAME_SETUP `elements`; the saved `.jcz`
// elements are the minimal pre-expansion view. Only `<enforces element="X"/>` is
// unconditionally injected (plus the legacy SET_ELEMENTS map for pre-elements-era sets).
// MUST match state-parity.test.ts / jcz-wire.mjs.
const SET_ELEMENTS: Record<string, string[]> = {
  "wind-roses": ["wind-rose"],
  darmstadt: ["church"],
  monasteries: ["monastery"],
  river: ["river"],
  flier: ["flier"],
  "corn-circles": ["corn-circle"],
  "russian-promos": ["russian-trap"],
  watchtowers: ["watchtower"],
};

function expandElements(
  sets: Record<string, number>,
  elements: Record<string, unknown>,
  xmlContents: string[],
): Record<string, unknown> {
  const out = { ...elements };
  const ids = Object.keys(sets).map((k) => k.split(":")[0].split("/")[0]);
  for (const [prefix, keys] of Object.entries(SET_ELEMENTS)) {
    if (ids.includes(prefix)) for (const k of keys) if (!(k in out)) out[k] = true;
  }
  for (const xml of xmlContents) {
    for (const m of xml.matchAll(/<enforces\s+element="([^"]+)"/g)) {
      if (!(m[1] in out)) out[m[1]] = true;
    }
  }
  return out;
}

function expandRules(
  sets: Record<string, number>,
  rules: Record<string, unknown>,
  elements: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...rules };
  const ids = Object.keys(sets).map((k) => k.split(":")[0].split("/")[0]);
  if (ids.includes("labyrinth") && !("labyrinth-variant" in out)) out["labyrinth-variant"] = "advanced";
  if ("count" in elements && !("coc-final-scoring" in out)) out["coc-final-scoring"] = "market-only";
  if (("king" in elements || "robber" in elements) && !("king-and-robber-scoring" in out)) {
    out["king-and-robber-scoring"] = "default";
  }
  return out;
}

function buildSetupMessage(jcz: Jcz, xmlContents: string[]): GameSetupMessage {
  const msg = new GameSetupMessage();
  msg.sets = jcz.setup.sets;
  msg.tiles = jcz.setup.tiles ?? null;
  const elements = expandElements(jcz.setup.sets, jcz.setup.elements ?? {}, xmlContents);
  msg.elements = elements;
  msg.rules = expandRules(jcz.setup.sets, jcz.setup.rules ?? {}, elements);
  msg.players = jcz.players.length;
  msg.initialRandom = jcz.initialRandom;
  msg.start = jcz.setup.start.map((s) => {
    const item = new GameSetupMessage.PlacedTileItem();
    item.tile = s.tile;
    item.x = s.x;
    item.y = s.y;
    item.rotation = s.rotation;
    return item;
  });
  return msg;
}

function runReplay(jcz: Jcz): GameState {
  const xmlContents = loadXmlsForSets(jcz.setup.sets);
  const setupMsg = buildSetupMessage(jcz, xmlContents);
  const setup = createSetupFromMessage(setupMsg);

  const reducer = new GameStatePhaseReducer(setup, jcz.initialRandom);
  const builder = new GameStateBuilder(xmlContents, setup, jcz.players.length, jcz.initialRandom);
  builder.setGameAnnotations(jcz.gameAnnotations ?? null);
  builder.setTileOverrides(jcz.setup.tiles ?? null);

  let state = builder.createInitialState();
  const firstPhase = reducer.getFirstPhase();
  state = state.setPhase(firstPhase);
  state = reducer.applyStepResult(firstPhase.enter(state));

  const parser = new MessageParser();
  for (const entry of jcz.replay) {
    const msg = parser.parse(entry);
    const rnd = (msg as { getRandom?: () => number | null }).getRandom;
    if (typeof rnd === "function") {
      const r = rnd.call(msg);
      if (r !== null && r !== undefined) reducer.getRandomGenerator().setRandom(r);
    }
    state = reducer.apply(state, msg);
  }

  return state;
}

// The scalar fields that identify WHICH thing an action item is about, in precedence order.
// One list covers every action type instead of a per-type switch: `Meeple` carries `meeple`,
// `TilePlacement` a `tileId`, `TowerPiece`/`Tunnel` a `token`, `ReturnMeeple` a `source`, the
// fairy/dragon/donkey actions a `figureId`, and the rest (Confirm, BazaarBid, ...) none at all.
// MUST match the client recorder in FanCloisterZone src/renderer/store/game.js.
const ACTION_QUALIFIERS = ["meeple", "tileId", "token", "source", "figureId"] as const;

/** `Meeple,SmallFollower` / `TilePlacement,BA/L` / `Confirm` — one descriptor per action item. */
function describeAction(item: Record<string, unknown>): string {
  const type = String(item.type);
  for (const key of ACTION_QUALIFIERS) {
    const v = item[key];
    if (typeof v === "string" || typeof v === "number") return `${type},${v}`;
  }
  return type;
}

/** The action items offered in `state`, described the same way the client records them. */
function actionDescriptors(state: GameState): string[] {
  const actions = state.getPlayerActions();
  if (actions === null) return [];
  const gson = new StateGsonBuilder();
  return actions
    .getActions()
    .toArray()
    .map((a) => describeAction(gson.serializeAction(a as PlayerAction<unknown>)));
}

/** `Available actions: A; B` — split into descriptors; an empty list or `none` means none. */
function parseActionList(raw: string): string[] {
  const body = raw.trim();
  if (body === "" || body.toLowerCase() === "none") return [];
  return body
    .split(";")
    .map((x) => x.trim())
    .filter((x) => x !== "");
}

interface Expectations {
  /** player index -> expected score */
  scores: Map<number, number>;
  /** the exhaustive set of offered action items, or null when the .jcz does not assert it */
  actions: string[] | null;
}

function parseAssertions(assertions: string[], players: Array<{ name: string; slot: number }>): Expectations {
  // The engine indexes players (and the score array) by their 0-based position in the
  // players list, NOT by slot — map assertion names to that index.
  const byName = new Map<string, number>();
  players.forEach((p, i) => byName.set(p.name, i));
  const scores = new Map<number, number>();
  let actions: string[] | null = null;
  for (const a of assertions) {
    const trimmed = a.trim();
    const score = /^(.+?) has (-?\d+) points?$/.exec(trimmed);
    if (score) {
      const idx = byName.get(score[1]);
      if (idx !== undefined) scores.set(idx, parseInt(score[2], 10));
      continue;
    }
    // Exhaustive by design: it fails on an EXTRA offered action as well as a missing one,
    // which is the point — e.g. a Mini Meeple that must not be deployable in the turn it
    // was awarded would otherwise slip through unnoticed.
    const acts = /^Available actions?:(.*)$/i.exec(trimmed);
    if (acts) actions = parseActionList(acts[1]);
  }
  return { scores, actions };
}

const entries = discover();
const byDir = new Map<string, Array<{ dir: string; file: string }>>();
for (const e of entries) {
  if (!byDir.has(e.dir)) byDir.set(e.dir, []);
  byDir.get(e.dir)!.push(e);
}

for (const [dir, dirEntries] of [...byDir.entries()].sort()) {
  describe(`engine-tests/${dir}`, () => {
    for (const { file } of dirEntries.sort((a, b) => a.file.localeCompare(b.file))) {
      const jcz = JSON.parse(readFileSync(join(TESTS_ROOT, dir, file), "utf8")) as Jcz;
      const name = `${file} — ${jcz.test?.description ?? ""}`;
      if (jcz.setup.addons) {
        it.skip(`${name} (skipped: has addons)`, () => {});
        continue;
      }
      if (!xmlFilesExist(jcz.setup.sets)) {
        it.skip(`${name} (skipped: missing set XML)`, () => {});
        continue;
      }
      const expected = parseAssertions(jcz.test?.assertions ?? [], jcz.players);
      if (!jcz.test?.assertions?.length) {
        // no assertions at all in this .jcz (golden-only test) — nothing to check here
        it.skip(`${name} (skipped: no assertions)`, () => {});
        continue;
      }
      // A fixture whose assertions this harness cannot evaluate still replays below: that alone
      // catches a replay that throws. The rest of the lines — `Phase is ...`, `Meeple X
      // options: ...` — are verified by the CLIENT instead (FanCloisterZone
      // src/renderer/utils/testing.js); only scores and `Available actions:` are checked here.
      if (jcz.replay.some((m) => m.type === "UNDO")) {
        // this score proxy replays straight through the reducer and doesn't model undo
        // history (the Engine/Game does); such replays are covered by state-parity.
        it.skip(`${name} (skipped: replay uses UNDO)`, () => {});
        continue;
      }
      it(name, () => {
        const state = runReplay(jcz);
        const scores = state.getPlayers().getScore().toArray();
        for (const [idx, points] of expected.scores) {
          expect(scores[idx], `${jcz.players[idx]?.name} score`).toBe(points);
        }
        if (expected.actions !== null) {
          // compared as sorted sets, so the assertion does not depend on the order the
          // engine happens to append actions in
          const actual = actionDescriptors(state).sort();
          expect(actual, "available actions").toEqual([...expected.actions].sort());
        }
      });
    }
  });
}
