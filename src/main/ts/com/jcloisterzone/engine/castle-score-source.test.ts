// A castle scores the value of the best completed feature in its vicinity. The points alone say
// nothing about where they came from, so the scoring pointer names the source feature too and the
// client can highlight the pair. Replays a recorded game rather than building one by hand: the
// castle rules (vicinity, cascade, the tile placed this turn being excluded) are fiddly enough
// that a synthetic board would mostly test the test.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import { describe, it, expect } from "vitest";
import { setDomParserFactory, type XmlDOMParser } from "../XmlUtils.js";

setDomParserFactory(() => new DOMParser() as unknown as XmlDOMParser);

type Ptr = {
  position?: [number, number];
  location?: string;
  feature?: string;
  featurePointer?: { position: [number, number]; location: string; feature: string };
  source?: { position: [number, number]; location: string; feature: string };
};
type PointsEntry = { name: string; points: number; ptr: Ptr };

const REPO = process.cwd();

/** Every "points" entry of every recorded state of a golden, flattened. */
const pointEntries = (dir: string, file: string): PointsEntry[] => {
  const raw = readFileSync(resolve(join(REPO, "engine-tests", dir, file)), "utf8");
  const out: PointsEntry[] = [];
  for (const line of raw.split("\n").filter(Boolean)) {
    const walk = (v: unknown): void => {
      if (Array.isArray(v)) { v.forEach(walk); return; }
      if (v !== null && typeof v === "object") {
        const o = v as Record<string, unknown>;
        if (o.type === "points" && Array.isArray(o.points)) out.push(...(o.points as PointsEntry[]));
        Object.values(o).forEach(walk);
      }
    };
    walk(JSON.parse(line));
  }
  return out;
};

const castleScores = (dir: string, file: string) =>
  pointEntries(dir, file).filter(e => e.name === "castle");

describe("a castle names the feature it took its points from", () => {
  const scores = castleScores("bridge-bazaar-and-castles", "castle-unoccupied-trigger.golden.jsonl");

  it("scores at least one castle in this game", () => {
    expect(scores.length).toBeGreaterThan(0);
  });

  it("points at the castle AND at the source", () => {
    const scored = scores.filter(e => e.points > 0);
    expect(scored.length).toBeGreaterThan(0);
    for (const e of scored) {
      expect(e.ptr.featurePointer, JSON.stringify(e.ptr)).toBeDefined();
      expect(e.ptr.featurePointer!.feature).toBe("Castle");
      expect(e.ptr.source, JSON.stringify(e.ptr)).toBeDefined();
    }
  });

  it("names a real feature as the source, not the castle itself", () => {
    for (const e of scores.filter(e => e.ptr.source)) {
      const { featurePointer: fp, source } = e.ptr;
      expect(source!.feature).toBeTruthy();
      expect(source!.location).toBeTruthy();
      // the source is a different place from the castle - a castle cannot feed itself
      const samePlace =
        source!.position[0] === fp!.position[0] &&
        source!.position[1] === fp!.position[1] &&
        source!.location === fp!.location;
      expect(samePlace).toBe(false);
    }
  });

  it("agrees with the points breakdown about the KIND of source", () => {
    // the expression is already named e.g. "castle.road"; the pointer must not contradict it
    for (const e of castleScores("meteorites", "meteorites-castles.golden.jsonl")) {
      if (!e.ptr.source) continue;
      const items = (e as unknown as { items: { name: string }[] }).items || [];
      const kind = items[0]?.name?.replace(/^castle\./, "");
      if (!kind || kind === "castle.incomplete") continue;
      expect(e.ptr.source.feature.toLowerCase()).toBe(kind.toLowerCase());
    }
  });
});

describe("an unfinished castle at final scoring", () => {
  it("keeps the plain pointer - it scores nothing, so there is nothing to attribute", () => {
    const incomplete = pointEntries("bridge-bazaar-and-castles", "field-castle-scoring.golden.jsonl")
      .filter(e => e.name === "castle" &&
        ((e as unknown as { items: { name: string }[] }).items || [])
          .some(i => i.name === "castle.castle.incomplete"));
    expect(incomplete.length).toBeGreaterThan(0);
    for (const e of incomplete) {
      expect(e.ptr.source).toBeUndefined();
      expect(e.ptr.feature).toBe("Castle");
    }
  });
});
