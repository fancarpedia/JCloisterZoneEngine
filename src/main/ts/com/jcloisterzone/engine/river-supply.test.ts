// Supply tiles wait for the river: while river tiles remain to be drawn, neither the abbey nor a
// Kingdom Palace is offered — a hole in the river is filled by river tiles. Once the river is laid
// they are offered as usual (TileFromSupplyPhase → RiverCapability.isRiverInProgress).
//
// A ring of 8 BA/L (monastery, field on all edges) around (10,0) makes a hole there; the ring is
// preplaced with `start`, which bypasses placement legality, so it can float beside the river spring.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { describe, it, expect } from "vitest";
import { setDomParserFactory, type XmlDOMParser } from "../XmlUtils.js";
import { Engine } from "./Engine.js";

setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);

const xml = (f: string): string => readFileSync(resolve(join(process.cwd(), "xmls", f)), "utf8");
const RING_SET = `<?xml version="1.0" encoding="utf-8"?>
<defs><sets><tile-set id="ring"><ref count="10" tile="BA/L" /></tile-set></sets></defs>`;

type State = Record<string, unknown>;
type Item = { type: string; tileId?: string };

function ring(cx: number, cy: number): Array<{ tile: string; x: number; y: number; rotation: number }> {
  const out = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx !== 0 || dy !== 0) out.push({ tile: "BA/L", x: cx + dx, y: cy + dy, rotation: 0 });
    }
  }
  return out;
}

function setup(river: boolean): State {
  const engine = new Engine(() => "");
  (engine as unknown as { tileDefinitions: string[] }).tileDefinitions = [
    xml("basic.xml"),
    xml("river.xml"),
    xml("abbey_and_mayor.xml"),
    xml("kingdoms.xml"),
    RING_SET,
  ];
  const out = engine.processInput(
    JSON.stringify({
      type: "GAME_SETUP",
      payload: {
        initialRandom: 0.5,
        players: 1,
        gameAnnotations: {},
        sets: { ring: 1, ...(river ? { "river/1:1": 1 } : {}) },
        elements: { "small-follower": 7, abbey: 1, "kingdom-palace": 1, ...(river ? { river: true } : {}) },
        rules: {},
        start: [...(river ? [{ tile: "RI/s", x: 0, y: 0, rotation: 0 }] : []), ...ring(10, 0)],
      },
    }),
  );
  return JSON.parse(out!) as State;
}

function supplyOffers(state: State): string[] {
  const action = state.action as { items: Item[] } | null;
  return (action ? action.items : [])
    .filter((i) => i.type === "TilePlacement" && (i.tileId === "AM/A" || i.tileId?.startsWith("Kingdoms/")))
    .map((i) => i.tileId!);
}

describe("supply tiles wait for the river", () => {
  it("the abbey is offered for a hole when there is no river", () => {
    const state = setup(false);
    expect(state.phase).toBe("TileFromSupplyPhase");
    expect(supplyOffers(state)).toEqual(["AM/A"]);
  });

  it("while river tiles remain, the abbey is not offered — even with a hole on the board", () => {
    const state = setup(true);
    expect(supplyOffers(state)).toEqual([]);
    expect(state.phase).toBe("TilePhase"); // straight to drawing the next river tile
    // still in hand for later
    const tokens = (state.players as Array<{ tokens: Record<string, { count: number }> }>)[0].tokens;
    expect(tokens.ABBEY_TILE.count).toBe(1);
    expect(tokens.KINGDOM_PALACE.count).toBe(1);
  });
});
