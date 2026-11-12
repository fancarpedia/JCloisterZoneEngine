// Courier points come from features next to where the courier went, scored for the courier's
// owner. Like a regular score event, each entry carries the followers standing on the scored
// feature, so the client can show who was involved (and pulse the ones that have since left
// the board). Reads the recorded courier goldens.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

type Place = { position: [number, number]; location: string; feature: string };
type ScoredMeeple = Place & { type: string; player: number };
type PointsEntry = { name: string; points: number; ptr: Place; meeples?: ScoredMeeple[] };

const DIR = join(process.cwd(), "engine-tests", "courier");

const courierEntries = (): Array<{ file: string; entry: PointsEntry }> => {
  const out: Array<{ file: string; entry: PointsEntry }> = [];
  for (const file of readdirSync(DIR).filter(f => f.endsWith(".golden.jsonl"))) {
    const seen = new Set<string>();
    for (const line of readFileSync(join(DIR, file), "utf8").split(/\r?\n/).filter(Boolean)) {
      const walk = (v: unknown): void => {
        if (Array.isArray(v)) { v.forEach(walk); return; }
        if (v !== null && typeof v === "object") {
          const o = v as Record<string, unknown>;
          if (o.type === "points" && Array.isArray(o.points)) {
            for (const e of o.points as PointsEntry[]) {
              // every recorded state repeats the history - keep each entry once
              const key = JSON.stringify(e);
              if (e.name.startsWith("courier.") && !seen.has(key)) {
                seen.add(key);
                out.push({ file, entry: e });
              }
            }
          }
          Object.values(o).forEach(walk);
        }
      };
      walk(JSON.parse(line));
    }
  }
  return out;
};

describe("courier points carry the meeples of the scored feature", () => {
  const entries = courierEntries();

  it("finds courier scoring in the recorded games", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it("lists at least one meeple for every courier entry", () => {
    const without = entries.filter(({ entry }) => !entry.meeples || entry.meeples.length === 0);
    expect(without.map(({ file, entry }) => file + " " + entry.name)).toEqual([]);
  });

  it("points a range feature (monastery, …) at the tiles that earned the points", () => {
    const monasteries = entries.filter(({ entry }) => entry.name.startsWith("courier.monastery"));
    expect(monasteries.length).toBeGreaterThan(0);
    for (const { file, entry } of monasteries) {
      const ptr = entry.ptr as unknown as { featurePointer?: Place; positions?: unknown[] };
      expect(ptr.featurePointer, file + " " + JSON.stringify(entry.ptr)).toBeDefined();
      // the monastery tile plus its neighbours in range
      expect((ptr.positions || []).length, file).toBeGreaterThan(1);
    }
  });

  it("includes the meeple the pointer names, standing on the scored feature", () => {
    for (const { file, entry } of entries) {
      const meeples = entry.meeples;
      const raw = entry.ptr as unknown as Place & { featurePointer?: Place };
      const ptr = raw.featurePointer || raw;
      const onPointer = (meeples || []).some(m =>
        m.position[0] === ptr.position[0] && m.position[1] === ptr.position[1] &&
        m.location === ptr.location && m.feature === ptr.feature,
      );
      expect(onPointer, file + " " + JSON.stringify(entry)).toBe(true);
      for (const m of meeples || []) {
        expect(typeof m.player, file).toBe("number");
        expect(m.type, file).toBeTruthy();
      }
    }
  });
});
