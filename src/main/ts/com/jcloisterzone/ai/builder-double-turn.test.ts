// Regression: RankingAiPlayer searched move chains past COMMIT into the builder's second turn
// part. Applying COMMIT during the search draws a hypothetical next tile, so the cached chain
// ended with a PLACE_TILE for a tile that was never actually drawn; on the real second part the
// AI returned that stale move and the reducer rejected it ("Invalid placement").
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { describe, it, expect } from "vitest";
import { setDomParserFactory, type XmlDOMParser } from "../XmlUtils.js";
import { createSetupFromMessage } from "../engine/EngineSetup.js";
import { GameStatePhaseReducer } from "../game/GameStatePhaseReducer.js";
import { GameOverPhase } from "../game/phase/GameOverPhase.js";
import { GameStateBuilder } from "../game/state/GameStateBuilder.js";
import type { GameState } from "../game/state/GameState.js";
import { MessageParser } from "../io/MessageParser.js";
import { CommitMessage } from "../io/message/CommitMessage.js";
import type { Message } from "../io/message/Message.js";
import { PlaceTileMessage } from "../io/message/PlaceTileMessage.js";
import { Player } from "../Player.js";
import { LegacyAiPlayer } from "./player/LegacyAiPlayer.js";

setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);

const REPO = process.cwd();
const XMLS = ["basic.xml", "traders_and_builders.xml"];

function newGame(initialRandom: number): { reducer: GameStatePhaseReducer; state: GameState } {
  const setupMsg = new MessageParser().parseSetup({
    sets: { "basic:1": 1, "traders-and-builders:1": 1 },
    elements: { "small-follower": 7, farmers: true, builder: 1, pig: 1, traders: true, "pig-herd": true },
    rules: {},
    timer: null,
    start: [{ tile: "BA/RCr", x: 0, y: 0, rotation: 0 }],
    players: 2,
    initialRandom,
    gameAnnotations: null,
  });
  const setup = createSetupFromMessage(setupMsg);
  const reducer = new GameStatePhaseReducer(setup, initialRandom);
  const definitions = XMLS.map((x) => readFileSync(join(REPO, "xmls", x), "utf8"));
  let state = new GameStateBuilder(definitions, setup, setupMsg.getPlayers(), initialRandom).createInitialState();
  const firstPhase = reducer.getFirstPhase();
  state = state.setPhase(firstPhase);
  state = reducer.applyStepResult(firstPhase.enter(state));
  return { reducer, state };
}

describe("RankingAiPlayer with the builder", () => {
  // each of these seeds reaches a builder double turn within the first ~25 turns
  it.each([0.2, 0.4, 0.5, 0.9])("plays the builder's second turn part with the drawn tile (seed %s)", (seed) => {
    let { reducer, state } = newGame(seed);
    const ais = [new LegacyAiPlayer(reducer, new Player(0)), new LegacyAiPlayer(reducer, new Player(1))];

    let doubleTurns = 0;
    let committedBy: number | null = null; // turn player who sent the last COMMIT
    while (doubleTurns < 2 && !(state.getPhase() instanceof GameOverPhase)) {
      const msg = ais[state.getActivePlayer()!.getIndex()]!.apply(state);
      if (msg instanceof PlaceTileMessage) {
        expect(msg.getTileId()).toBe(state.getDrawnTile()!.getId());
        if (committedBy === state.getTurnPlayer()!.getIndex()) doubleTurns++;
        committedBy = null;
      }
      if (msg instanceof CommitMessage) committedBy = state.getTurnPlayer()!.getIndex();
      state = reducer.apply(state, msg as unknown as Message);
    }
    expect(doubleTurns).toBe(2);
  });
});
