import { describe, it, expect } from "vitest";
import { Valued, combineHash, hashCode } from "./equality.js";
import { Map as VMap, HashMap, LinkedHashMap, TreeMap } from "./Map.js";
import { HashSet } from "./Set.js";
import { List, Vector } from "./SeqTypes.js";
import { Option } from "./Option.js";
import { Tuple2 } from "./Tuple.js";

/** A value-equality key, like board.Position. */
class Pos implements Valued {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}
  equals(o: unknown): boolean {
    return o instanceof Pos && o.x === this.x && o.y === this.y;
  }
  hashCode(): number {
    return combineHash(this.x, this.y);
  }
  toString(): string {
    return `[${this.x},${this.y}]`;
  }
}

describe("value-equality maps", () => {
  it("looks up by structural key, not identity", () => {
    let m: VMap<Pos, string> = HashMap.empty<Pos, string>();
    m = m.put(new Pos(1, 2), "a");
    expect(m.get(new Pos(1, 2)).getOrNull()).toBe("a");
    expect(m.containsKey(new Pos(1, 2))).toBe(true);
    expect(m.get(new Pos(9, 9)).isEmpty()).toBe(true);
  });

  it("put replaces existing key in place", () => {
    let m: VMap<Pos, number> = HashMap.empty<Pos, number>();
    m = m.put(new Pos(0, 0), 1).put(new Pos(0, 0), 2);
    expect(m.size()).toBe(1);
    expect(m.get(new Pos(0, 0)).get()).toBe(2);
  });

  it("is persistent (copy-on-write)", () => {
    const a = HashMap.empty<Pos, number>().put(new Pos(1, 1), 1);
    const b = a.put(new Pos(2, 2), 2);
    expect(a.size()).toBe(1);
    expect(b.size()).toBe(2);
  });

  it("LinkedHashMap preserves insertion order", () => {
    const m = LinkedHashMap.empty<string, number>()
      .put("b", 1)
      .put("a", 2)
      .put("c", 3);
    expect(m.keysSeq().toArray()).toEqual(["b", "a", "c"]);
  });

  it("TreeMap keeps comparator order", () => {
    let m: VMap<number, string> = TreeMap.empty<number, string>((a, b) => a - b);
    m = m.put(3, "c").put(1, "a").put(2, "b");
    expect(m.keysSeq().toArray()).toEqual([1, 2, 3]);
  });

  it("merge keeps existing on collision", () => {
    const a = HashMap.of<string, number>("x", 1, "y", 2);
    const b = HashMap.of<string, number>("y", 99, "z", 3);
    const merged = a.merge(b);
    expect(merged.get("y").get()).toBe(2);
    expect(merged.get("z").get()).toBe(3);
  });
});

describe("sets", () => {
  it("dedups by value equality", () => {
    const s = HashSet.of(new Pos(1, 1), new Pos(1, 1), new Pos(2, 2));
    expect(s.size()).toBe(2);
    expect(s.contains(new Pos(1, 1))).toBe(true);
  });

  it("keeps insertion order across add/addAll/ofAll", () => {
    const s = HashSet.of(3, 1, 2).add(5).add(1).addAll([4, 3, 0]);
    expect(s.toArray()).toEqual([3, 1, 2, 5, 4, 0]);
  });

  it("add of an existing element returns the same instance", () => {
    const s = HashSet.of(new Pos(1, 1));
    expect(s.add(new Pos(1, 1))).toBe(s);
    expect(s.addAll([new Pos(1, 1)])).toBe(s);
  });

  it("addAll dedups within the batch", () => {
    const s = HashSet.of(new Pos(0, 0)).addAll([new Pos(1, 1), new Pos(1, 1), new Pos(0, 0)]);
    expect(s.toArray().map(String)).toEqual(["[0,0]", "[1,1]"]);
  });

  it("add does not leak into the parent set", () => {
    const a = HashSet.of(new Pos(1, 1));
    const b = a.add(new Pos(2, 2));
    const c = a.add(new Pos(3, 3));
    expect(a.contains(new Pos(2, 2))).toBe(false);
    expect(a.contains(new Pos(3, 3))).toBe(false);
    expect(b.contains(new Pos(3, 3))).toBe(false);
    expect(c.contains(new Pos(2, 2))).toBe(false);
    expect(b.size()).toBe(2);
    expect(c.size()).toBe(2);
  });

  it("handles hash collisions", () => {
    const x = new Collide("x");
    const y = new Collide("y");
    const a = HashSet.of(x);
    const b = a.add(y);
    expect(b.size()).toBe(2);
    expect(b.contains(new Collide("y"))).toBe(true);
    expect(a.contains(new Collide("y"))).toBe(false);
    expect(b.addAll([new Collide("z"), new Collide("x")]).size()).toBe(3);
  });

  it("remove after add", () => {
    const s = HashSet.of(1, 2).add(3).remove(2);
    expect(s.toArray()).toEqual([1, 3]);
    expect(s.contains(2)).toBe(false);
    expect(s.add(2).toArray()).toEqual([1, 3, 2]);
  });

  // The hash index must survive add/addAll/ofAll; rebuilding it on every new instance
  // makes building a set of n elements O(n²) hashCode calls.
  it("add reuses the hash index (linear hashCode calls)", () => {
    const n = 200;
    Counted.calls = 0;
    let s = HashSet.empty<Counted>();
    for (let i = 0; i < n; i++) s = s.add(new Counted(i)) as HashSet<Counted>;
    expect(s.size()).toBe(n);
    expect(Counted.calls).toBeLessThanOrEqual(3 * n);
  });

  it("addAll reuses the hash index (linear hashCode calls)", () => {
    const n = 200;
    const items = Array.from({ length: n }, (_, i) => new Counted(i));
    Counted.calls = 0;
    const s = HashSet.of(new Counted(-1)).addAll(items);
    expect(s.size()).toBe(n + 1);
    expect(s.contains(new Counted(n - 1))).toBe(true);
    expect(Counted.calls).toBeLessThanOrEqual(3 * n);
  });

  it("ofAll keeps the index it built (linear hashCode calls)", () => {
    const n = 200;
    const items = Array.from({ length: n }, (_, i) => new Counted(i));
    Counted.calls = 0;
    const s = HashSet.ofAll(items);
    for (let i = 0; i < n; i++) expect(s.contains(new Counted(i))).toBe(true);
    expect(Counted.calls).toBeLessThanOrEqual(3 * n);
  });
});

/** Every instance hashes to the same bucket. */
class Collide implements Valued {
  constructor(readonly id: string) {}
  equals(o: unknown): boolean {
    return o instanceof Collide && o.id === this.id;
  }
  hashCode(): number {
    return 42;
  }
}

/** Counts hashCode calls to detect index rebuilds. */
class Counted implements Valued {
  static calls = 0;
  constructor(readonly v: number) {}
  equals(o: unknown): boolean {
    return o instanceof Counted && o.v === this.v;
  }
  hashCode(): number {
    Counted.calls++;
    return this.v;
  }
}

describe("sequences", () => {
  it("map/filter/fold/distinct", () => {
    const v = Vector.of(1, 2, 2, 3, 4);
    expect(v.distinct().toArray()).toEqual([1, 2, 3, 4]);
    expect(v.filter((x) => x % 2 === 0).toArray()).toEqual([2, 2, 4]);
    expect(v.map((x) => x * 10).toArray()).toEqual([10, 20, 20, 30, 40]);
    expect(v.foldLeft(0, (a, b) => a + b)).toBe(12);
  });

  it("List and Vector are not equal across kinds", () => {
    expect(List.of(1, 2).equals(Vector.of(1, 2))).toBe(false);
    expect(List.of(1, 2).equals(List.of(1, 2))).toBe(true);
  });

  it("groupBy returns a map of same-kind groups", () => {
    const v = Vector.of(1, 2, 3, 4, 5);
    const g = v.groupBy((x) => x % 2);
    expect(g.get(0).get().toArray()).toEqual([2, 4]);
    expect(g.get(1).get().toArray()).toEqual([1, 3, 5]);
  });
});

describe("option & tuple", () => {
  it("option basics", () => {
    expect(Option.of(null).isEmpty()).toBe(true);
    expect(Option.of(5).map((x) => x + 1).get()).toBe(6);
    expect(Option.none<number>().getOrElse(7)).toBe(7);
  });

  it("tuples are value-equal and usable as keys", () => {
    const t1 = new Tuple2("a", 1);
    const t2 = new Tuple2("a", 1);
    expect(t1.equals(t2)).toBe(true);
    expect(hashCode(t1)).toBe(hashCode(t2));
    const m = HashMap.empty<Tuple2<string, number>, string>().put(t1, "v");
    expect(m.get(t2).get()).toBe("v");
  });
});
