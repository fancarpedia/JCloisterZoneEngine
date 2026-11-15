// Kingdoms end-to-end: two AI players play whole base games with 2 City Palaces each, through
// final scoring. Guards the palace placement + kingdom scoring paths against crashes on real,
// messy boards (merged capitals, many fields) that the hand-built city-palace.test.ts never sees.
import { readFileSync } from "node:fs";
import { DOMParser } from "@xmldom/xmldom";
import { expect, it } from "vitest";
import { setDomParserFactory, type XmlDOMParser } from "../XmlUtils.js";
import { Engine } from "./Engine.js";
setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);

for (const seed of [0.11, 0.37, 0.52, 0.73, 0.91]) {
  it("AI self-play to final scoring with City Palaces, seed " + seed, () => {
    const e = new Engine(() => "");
    (e as unknown as { tileDefinitions: string[] }).tileDefinitions = [
      readFileSync("xmls/basic.xml", "utf8"),
      readFileSync("xmls/kingdoms.xml", "utf8"),
    ];
    const send = (m: unknown): Record<string, unknown> | null => {
      const r = e.processInput(JSON.stringify(m));
      return r ? (JSON.parse(r) as Record<string, unknown>) : null;
    };
    let s = send({
      type: "GAME_SETUP",
      payload: {
        initialRandom: seed, players: 2, playerSlots: [0, 1], gameAnnotations: {},
        sets: { "basic:1": 1 },
        elements: { "small-follower": 7, farmers: true, "city-palace": 2 },
        rules: {},
        start: [{ tile: "BA/RCr", x: 0, y: 0, rotation: 0 }],
      },
    })!;
    let steps = 0;
    let palaces = 0;
    while (s.phase !== "GameOverPhase" && steps++ < 3000) {
      const action = s.action as { player: number } | null;
      if (!action) throw new Error("no action in " + String(s.phase));
      const ai = send({ type: "AI", payload: {}, player: action.player, seq: steps }) as { payload: { type: string; payload: Record<string, unknown> } };
      const move = ai.payload;
      if (move.type === "PLACE_TILE" && String(move.payload.tileId).startsWith("Kingdoms/")) palaces++;
      const payload = move.type === "COMMIT" ? { ...move.payload, random: (steps * 0.6180339887) % 1 } : move.payload;
      const next = send({ type: move.type, payload, player: action.player });
      if (next === null) break;
      s = next;
    }
    const pts = (s.history as Array<{ events: Array<{ type: string; points?: Array<{ name: string; points: number; player: number }> }> }>)
      .flatMap((t) => t.events).filter((x) => x.type === "points").flatMap((x) => x.points!).filter((p) => p.name === "kingdom");
    expect(s.phase).toBe("GameOverPhase");
    expect(palaces).toBeGreaterThan(0);
    // the AI rarely completes a capital, so kingdoms may well score nothing — final scoring must
    // still run through cleanly
    for (const p of pts) expect(p.points % 3).toBe(0);
  });
}
