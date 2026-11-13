// Automatic placements/moves/returns name what triggered them (PlacementCause → `cause` on the
// meeple-deployed / meeple-returned / neutral-moved / token-placed / token-removed events). Reads
// the recorded goldens, where these causes are pinned.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

type Cause =
  | { type: "tile-placed"; position: [number, number] }
  | { type: "meeple-deployed"; pointer: unknown; meeple: { id: string; type: string; player: number } }
  | { type: "figure-moved"; figure: string; pointer: unknown }
  | { type: "rule"; name: string };
type Ev = { type: string; figure?: string; token?: string; to?: unknown; cause?: Cause };

const ROOT = join(process.cwd(), "engine-tests");

/** every event of the final recorded state of every golden in `dir` */
const finalEvents = (dir: string): Ev[] => {
  const out: Ev[] = [];
  for (const f of readdirSync(join(ROOT, dir)).filter(n => n.endsWith(".golden.jsonl"))) {
    const lines = readFileSync(join(ROOT, dir, f), "utf8").split(/\r?\n/).filter(Boolean);
    const last = JSON.parse(lines[lines.length - 1]) as { history?: Array<{ events: Ev[] }> };
    for (const turn of last.history || []) out.push(...turn.events);
  }
  return out;
};

const allDirs = readdirSync(ROOT).filter(d => statSync(join(ROOT, d)).isDirectory());

describe("courier placements name their cause", () => {
  const moves = finalEvents("courier").filter(e => e.type === "neutral-moved" && e.figure?.startsWith("courier"));

  it("the letter placement was caused by placing that tile", () => {
    const onLetter = moves.filter(e => (e.to as { feature?: string } | null)?.feature === "CourierLetter");
    expect(onLetter.length).toBeGreaterThan(0);
    for (const e of onLetter) {
      expect(e.cause?.type, JSON.stringify(e)).toBe("tile-placed");
      const to = e.to as { position: [number, number] };
      expect((e.cause as { position: [number, number] }).position).toEqual(to.position);
    }
  });

  it("a move beside a meeple was caused by deploying that meeple", () => {
    const beside = moves.filter(e => (e.to as { feature?: string } | null)?.feature !== "CourierLetter");
    expect(beside.length).toBeGreaterThan(0);
    for (const e of beside) {
      expect(e.cause?.type, JSON.stringify(e)).toBe("meeple-deployed");
      const c = e.cause as { meeple: { id: string; player: number } };
      expect(c.meeple.id).toBeTruthy();
      expect(typeof c.meeple.player).toBe("number");
    }
  });
});

describe("other automatic placements name their cause", () => {
  const events = allDirs.flatMap(finalEvents);
  const causeOf = (pred: (e: Ev) => boolean) => events.filter(pred).map(e => e.cause);

  it("a mandatory bridge comes from the tile placement", () => {
    const causes = causeOf(e => e.type === "token-placed" && e.token === "BRIDGE" && !!e.cause);
    expect(causes.length).toBeGreaterThan(0);
    for (const c of causes) expect(c!.type).toBe("tile-placed");
  });

  it("gold placed without a choice comes from the gold-mine tile", () => {
    const causes = causeOf(e => e.type === "token-placed" && e.token === "GOLD" && !!e.cause);
    expect(causes.length).toBeGreaterThan(0);
    for (const c of causes) expect(c!.type).toBe("tile-placed");
  });

  it("meteorite and wolf returns name their rule; a dragon names its move", () => {
    const rules = new Set(causeOf(e => e.type === "meeple-returned" && e.cause?.type === "rule").map(c => (c as { name: string }).name));
    expect(rules.has("meteorite")).toBe(true);
    expect(rules.has("wolf")).toBe(true);
    const eaten = causeOf(e => e.type === "meeple-returned" && e.cause?.type === "figure-moved");
    expect(eaten.length).toBeGreaterThan(0);
    for (const c of eaten) expect((c as { figure: string }).figure.startsWith("dragon")).toBe(true);
  });

  it("player-chosen placements carry no cause", () => {
    // a fairy is only ever moved by its player
    const fairy = events.filter(e => e.type === "neutral-moved" && e.figure?.startsWith("fairy"));
    expect(fairy.length).toBeGreaterThan(0);
    for (const e of fairy) expect(e.cause).toBeUndefined();
  });
});

describe("caused events that used to be left out of the history are written", () => {
  const events = allDirs.flatMap(finalEvents);

  it("the dragon summoned onto a volcano, caused by that tile", () => {
    const summoned = events.filter(e => e.type === "neutral-moved" && e.figure?.startsWith("dragon"));
    expect(summoned.length).toBeGreaterThan(0);
    for (const e of summoned) expect(e.cause?.type).toBe("tile-placed");
  });

  it("scoring returns the game caused (flock, windmill, obelisk, Děčínský Sněžník)", () => {
    const names = new Set(
      events
        .filter(e => e.type === "meeple-returned" && (e as { forced?: boolean }).forced === false)
        .map(e => (e.cause as { name: string }).name),
    );
    for (const n of ["flock-scored", "windmill-scored", "obelisk-scored", "decinsky-sneznik-scored"]) {
      expect(names.has(n), n).toBe(true);
    }
  });
});

describe("the mage and witch name why the player had to place them", () => {
  it("a tile with the magician symbol was placed", () => {
    const placed = finalEvents("mage-and-witch").filter(
      e => e.type === "neutral-moved" && /^(mage|witch)/.test(e.figure || "") && e.to,
    );
    expect(placed.length).toBeGreaterThan(0);
    for (const e of placed) expect(e.cause?.type, JSON.stringify(e)).toBe("tile-placed");
  });
});

describe("removing the mage or witch after their features joined", () => {
  it("is accepted with to: null and names the joined features as its cause", () => {
    const removed = finalEvents("mage-and-witch").filter(
      e => e.type === "neutral-moved" && /^(mage|witch)/.test(e.figure || "") && !e.to,
    );
    expect(removed.length).toBeGreaterThan(0);
    for (const e of removed) {
      expect(e.cause, JSON.stringify(e)).toEqual({ type: "rule", name: "mage-witch-joined" });
    }
  });
});
