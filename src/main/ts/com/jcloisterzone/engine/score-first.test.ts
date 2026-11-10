// SCORE_FIRST - when two or more completed features sit beside one castle, the turn player picks
// which is scored first, and the castle takes the points of THAT one.
//
// Board (found by search, not hand-guessed): a castle on (0,-1)+(0,0) owned by player 0, the start
// road closed at its west end by a junction at (-1,0). Then a monastery-with-road at (1,-1), then a
// crossroads at (1,0) which completes BOTH the main road (3 tiles) and the monastery's road
// (2 tiles), each beside the castle. Placed by player 1, so player 1 decides.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { describe, it, expect } from "vitest";
import { setDomParserFactory, type XmlDOMParser } from "../XmlUtils.js";
import { Engine } from "./Engine.js";
import { ScoreFirstAction } from "../action/ScoreFirstAction.js";
import { ScoreFirstMessage } from "../io/message/ScoreFirstMessage.js";
import { isInstanceOfNonUndoableMessage } from "../io/message/NonUndoableMessage.js";
import { MessageParser } from "../io/MessageParser.js";
import { HashSet } from "../../../io/vavr/Set.js";

setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);
const BASIC = readFileSync(resolve(join(process.cwd(), "xmls", "basic.xml")), "utf8");

type Ptr = { position: [number, number]; location: string; feature: string };
type PointsEntry = {
  player: number;
  points: number;
  name: string;
  items: { name: string; points: number }[];
  ptr: { source?: Ptr };
};
type State = {
  phase: string;
  undo: { allowed: boolean; depth: number };
  action?: { player: number; canPass?: boolean; items: { type: string; options: Ptr[] }[] };
  history: { events: { type: string; points?: PointsEntry[] }[] }[];
};

const MAIN_ROAD: Ptr = { position: [1, 0], location: "W", feature: "Road" }; // 3 tiles
const SHORT_ROAD: Ptr = { position: [1, 0], location: "N", feature: "Road" }; // 2 tiles

const start = () => {
  const engine = new Engine(() => "");
  (engine as unknown as { tileDefinitions: string[] }).tileDefinitions = [BASIC];
  const send = (type: string, payload: unknown): State =>
    JSON.parse(engine.processInput(JSON.stringify({ type, payload }))!) as State;
  send("GAME_SETUP", {
    sets: { "basic:1": 1 },
    elements: { "small-follower": 7, farmers: true, castle: 1 },
    rules: {},
    start: [{ tile: "BA/RCr", x: 0, y: 0, rotation: 0 }],
    players: 2,
    initialRandom: 0.5,
    gameAnnotations: {
      tilePack: {
        className: "com.jcloisterzone.debug.ForcedDrawTilePack",
        params: { drawOrder: ["BA/C", "BA/RRR", "BA/LR", "BA/RRRR", "BA/L", "BA/L"] },
      },
    },
  });
  // P0: castle on the start city, with a follower in it
  send("PLACE_TILE", { tileId: "BA/C", rotation: "R180", position: [0, -1] });
  send("DEPLOY_MEEPLE", { pointer: { position: [0, -1], feature: "City", location: "S" }, meepleId: "0.small.1" });
  send("PLACE_TOKEN", { token: "CASTLE", pointer: { position: [0, -1], feature: "City", location: "S" } });
  send("COMMIT", { random: 0 });
  // P1: close the start road's west end
  send("PLACE_TILE", { tileId: "BA/RRR", rotation: "R0", position: [-1, 0] });
  send("PASS", {});
  send("COMMIT", { random: 0 });
  // P0: monastery with a road, beside the castle
  send("PLACE_TILE", { tileId: "BA/LR", rotation: "R0", position: [1, -1] });
  send("PASS", {});
  send("COMMIT", { random: 0 });
  // P1: the crossroads that completes both roads at once
  send("PLACE_TILE", { tileId: "BA/RRRR", rotation: "R0", position: [1, 0] });
  send("PASS", {});
  const asked = send("COMMIT", { random: 0 });
  return { engine, send, asked };
};

const castleScores = (s: State) =>
  s.history
    .flatMap((h) => h.events)
    .filter((e) => e.type === "points")
    .flatMap((e) => e.points!)
    .filter((p) => p.name === "castle");

const same = (a: Ptr | undefined, b: Ptr) =>
  !!a && a.position[0] === b.position[0] && a.position[1] === b.position[1] && a.location === b.location;

describe("asking which feature is scored first", () => {
  it("stops scoring and asks, when two completed features sit beside one castle", () => {
    const { asked } = start();
    expect(asked.phase).toBe("ScoringPhase");
    expect(asked.action!.items[0].type).toBe("ScoreFirst");
  });

  it("offers exactly the two contested roads", () => {
    const { asked } = start();
    const options = asked.action!.items[0].options;
    expect(options).toHaveLength(2);
    expect(options.some((o) => same(o, MAIN_ROAD))).toBe(true);
    expect(options.some((o) => same(o, SHORT_ROAD))).toBe(true);
  });

  it("asks the TURN player, not the castle's owner", () => {
    const { asked } = start();
    expect(asked.action!.player).toBe(1);
  });

  it("has not scored the castle yet", () => {
    const { asked } = start();
    expect(castleScores(asked)).toHaveLength(0);
  });

  it("offers no pass - the order has to be decided", () => {
    const { asked } = start();
    expect(asked.action!.canPass).toBeFalsy();
  });
});

describe("the castle takes the feature scored FIRST", () => {
  it("scores 3 when the main road goes first", () => {
    const { send } = start();
    const castle = castleScores(send("SCORE_FIRST", { pointer: MAIN_ROAD }));
    expect(castle).toHaveLength(1);
    expect(castle[0].points).toBe(3);
    expect(castle[0].player).toBe(0);
  });

  it("scores 2 when the short road goes first", () => {
    const { send } = start();
    expect(castleScores(send("SCORE_FIRST", { pointer: SHORT_ROAD }))[0].points).toBe(2);
  });

  it("names the chosen road as the castle's source", () => {
    const { send } = start();
    const castle = castleScores(send("SCORE_FIRST", { pointer: SHORT_ROAD }));
    expect(same(castle[0].ptr.source, SHORT_ROAD)).toBe(true);
  });

  it("then carries on to the next turn without asking again", () => {
    const { send } = start();
    const s = send("SCORE_FIRST", { pointer: MAIN_ROAD });
    expect(s.phase).toBe("TilePhase");
    expect(s.action!.items[0].type).not.toBe("ScoreFirst");
  });

  it("accepts any place of the chosen feature, not only the one offered", () => {
    // the main road also runs through the start tile; pointing there means the same road
    const { send } = start();
    const s = send("SCORE_FIRST", { pointer: { position: [0, 0], location: "WE", feature: "Road" } });
    expect(castleScores(s)[0].points).toBe(3);
  });
});

describe("the choice sticks", () => {
  it("leaves no undo point behind", () => {
    const { send } = start();
    expect(send("SCORE_FIRST", { pointer: SHORT_ROAD }).undo.allowed).toBe(false);
  });

  it("refuses a feature whose order is not in question", () => {
    const { engine } = start();
    const bogus = { type: "SCORE_FIRST", payload: { pointer: { position: [0, -1], location: "S", feature: "City" } } };
    expect(() => engine.processInput(JSON.stringify(bogus))).toThrow(/scoring order is open/);
  });
});

describe("plumbing", () => {
  const parser = new MessageParser();
  const ptr = (parser.parse({ type: "SCORE_FIRST", payload: { pointer: MAIN_ROAD } } as never) as ScoreFirstMessage)
    .getPointer()!;

  it("the message is marked never-undoable", () => {
    expect(isInstanceOfNonUndoableMessage(new ScoreFirstMessage(ptr))).toBe(true);
  });

  it("the action turns an option into the message, which is how the AI plays it", () => {
    const msg = new ScoreFirstAction(HashSet.of(ptr)).select(ptr);
    expect(msg).toBeInstanceOf(ScoreFirstMessage);
    expect((msg as ScoreFirstMessage).getPointer()).toBe(ptr);
  });

  it("round-trips through the wire format", () => {
    const wire = { type: "SCORE_FIRST", payload: { pointer: MAIN_ROAD } };
    expect(parser.toWire(parser.parse(wire as never))).toEqual(wire);
  });
});
