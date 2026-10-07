// Engine throughput benchmark: plays full 2-player games (farmers) and times the moves.
//
// Moves go straight through `reducer.apply` (no JSON wire, no state serialization), so this
// measures the engine core. Game setup (tile XML parsing, tile pack) is not timed.
//
// Scenarios:
//   random  — seeded random policy over all legal moves, basic game
//   random  — the same with Inns & Cathedrals
//   ai      — LegacyAiPlayer plays both sides, basic game (abbot is not included: not all
//             actions implement `select()` yet, so the AI cannot handle it)
//
// Every game is seeded, so the move count and final scores are fixed for a given engine
// behaviour. An optimization must not change them — compare them across runs.
//
// Usage (builds first):
//   npm run bench
//   npm run bench -- --games 100 --ai-games 1
//   npm run bench -- --only random
// To compare two builds, compile each with `npx tsc -p tsconfig.build.json --outDir <dir>` and
// run `node scripts/bench.mjs --dist <dir>` for each, interleaving the runs.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DOMParser } from "@xmldom/xmldom";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const XMLS_DIR = join(REPO, "xmls");

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i < 0 ? def : process.argv[i + 1];
}
const randomGames = Number(arg("--games", 60));
const aiGames = Number(arg("--ai-games", 2));
const only = arg("--only", null);
const distBase = join(resolve(arg("--dist", join(REPO, "dist"))), "com", "jcloisterzone");

const mod = (rel) => pathToFileURL(join(distBase, rel)).href;
const { setDomParserFactory } = await import(mod("XmlUtils.js")).catch((e) => {
  console.error("Could not load dist/. Run `npm run build` first.\n" + e.message);
  process.exit(2);
});
setDomParserFactory(() => new DOMParser());
const { MessageParser } = await import(mod("io/MessageParser.js"));
const { createSetupFromMessage } = await import(mod("engine/EngineSetup.js"));
const { GameStatePhaseReducer } = await import(mod("game/GameStatePhaseReducer.js"));
const { GameStateBuilder } = await import(mod("game/state/GameStateBuilder.js"));
const { GameOverPhase } = await import(mod("game/phase/GameOverPhase.js"));
const { AiPlayer } = await import(mod("ai/AiPlayer.js"));
const { LegacyAiPlayer } = await import(mod("ai/player/LegacyAiPlayer.js"));
const { Player } = await import(mod("Player.js"));

const BASIC = {
  xmls: ["basic.xml"],
  sets: { "basic:1": 1 },
  elements: { "small-follower": 7, farmers: true },
};
const INNS = {
  xmls: ["basic.xml", "inns_and_cathedrals.xml"],
  sets: { "basic:1": 1, "inns-and-cathedrals:1": 1 },
  elements: { "small-follower": 7, farmers: true, "big-follower": 1, cathedral: true, inn: true },
};

/** Small seeded PRNG (mulberry32), returns floats in [0, 1). */
function seeded(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Only for `getPossibleActions`; the random policy picks among them itself. */
class MoveLister extends AiPlayer {
  apply() {
    throw new Error("not used");
  }
}
const lister = new MoveLister();
const parser = new MessageParser();

/** Same steps as Engine's GAME_SETUP handling. */
function newGame(cfg, initialRandom) {
  const setupMsg = parser.parseSetup({
    sets: cfg.sets,
    elements: cfg.elements,
    rules: {},
    timer: null,
    start: [{ tile: "BA/RCr", x: 0, y: 0, rotation: 0 }],
    players: 2,
    initialRandom,
    gameAnnotations: null,
  });
  const setup = createSetupFromMessage(setupMsg);
  const reducer = new GameStatePhaseReducer(setup, initialRandom);
  const definitions = cfg.xmls.map((x) => readFileSync(join(XMLS_DIR, x), "utf8"));
  const builder = new GameStateBuilder(definitions, setup, setupMsg.getPlayers(), initialRandom);
  let state = builder.createInitialState();
  const firstPhase = reducer.getFirstPhase();
  state = state.setPhase(firstPhase);
  state = reducer.applyStepResult(firstPhase.enter(state));
  return { reducer, state };
}

function run(name, cfg, games, policy) {
  let ms = 0;
  let moves = 0;
  let scoreHash = 0;
  const totals = [0, 0];
  for (let g = 0; g < games; g++) {
    const rnd = seeded(1000 + g);
    let { reducer, state } = newGame(cfg, rnd());
    const choose = policy(reducer, rnd);
    const t0 = performance.now();
    while (!(state.getPhase() instanceof GameOverPhase)) {
      state = reducer.apply(state, choose(state));
      moves++;
    }
    ms += performance.now() - t0;
    state
      .getPlayers()
      .getScore()
      .toArray()
      .forEach((s, i) => {
        totals[i] += s;
        scoreHash = (Math.imul(scoreHash, 31) + s) | 0;
      });
  }
  console.log(
    `${name.padEnd(28)} ${(ms / games).toFixed(2).padStart(9)} ms/game ` +
      `${((ms * 1000) / moves).toFixed(1).padStart(8)} us/move ` +
      `${((games * 1000) / ms).toFixed(2).padStart(7)} games/s | ` +
      `${games} games, ${moves} moves, points ${totals.join(":")}, ` +
      `scores hash ${(scoreHash >>> 0).toString(16).padStart(8, "0")}`,
  );
}

// `getPossibleActions` may contain null for actions without `select()`; skip them.
const randomPolicy = (_reducer, rnd) => (state) => {
  const moves = lister.getPossibleActions(state).toArray().filter((m) => m !== null);
  return moves[Math.floor(rnd() * moves.length)];
};
const aiPolicy = (reducer) => {
  const players = [new LegacyAiPlayer(reducer, new Player(0)), new LegacyAiPlayer(reducer, new Player(1))];
  return (state) => players[state.getActivePlayer().getIndex()].apply(state);
};

if (only === null || only === "random") {
  run("random, basic", BASIC, randomGames, randomPolicy);
  run("random, basic + inns", INNS, randomGames, randomPolicy);
}
if (only === null || only === "ai") {
  run("LegacyAiPlayer, basic", BASIC, aiGames, aiPolicy);
}
