import { Valued, equals, hashCode, combineHash } from "./equality.js";
import { Option } from "./Option.js";
import { Tuple2 } from "./Tuple.js";
import { Seq, Comparator, __setGroupByImpl } from "./Seq.js";
import { List, Vector } from "./SeqTypes.js";
import { HashSet, type Set as VSet } from "./Set.js";

export type Entry<K, V> = Tuple2<K, V>;

/**
 * Persistent map with value-equality keys. Backed by an ordered entries array
 * plus a hash index (bucket -> entry indices) for O(1)-ish lookup. Copy-on-write.
 *
 * Concrete kinds: {@link HashMap}, {@link LinkedHashMap} (both insertion-ordered
 * here), {@link TreeMap} (comparator-ordered).
 */
export abstract class Map<K, V> implements Iterable<Tuple2<K, V>>, Valued {
  protected readonly entries: readonly Tuple2<K, V>[];
  private index: globalThis.Map<number, number[]> | null = null;

  constructor(entries: readonly Tuple2<K, V>[]) {
    this.entries = entries;
  }

  protected abstract rebuild(entries: readonly Tuple2<K, V>[]): Map<K, V>;
  /** Where a new key is inserted (append for hash/linked, sorted for tree). */
  protected abstract placeKey(
    entries: Tuple2<K, V>[],
    key: K,
    value: V,
  ): Tuple2<K, V>[];
  abstract get stringName(): string;

  private getIndex(): globalThis.Map<number, number[]> {
    if (this.index === null) {
      const idx = new globalThis.Map<number, number[]>();
      this.entries.forEach((e, i) => {
        const h = hashCode(e._1);
        const bucket = idx.get(h);
        if (bucket) bucket.push(i);
        else idx.set(h, [i]);
      });
      this.index = idx;
    }
    return this.index;
  }

  private indexOfKey(key: K): number {
    const bucket = this.getIndex().get(hashCode(key));
    if (!bucket) return -1;
    for (const i of bucket) {
      if (equals(this.entries[i]._1, key)) return i;
    }
    return -1;
  }

  // --- size ---
  size(): number {
    return this.entries.length;
  }
  length(): number {
    return this.entries.length;
  }
  isEmpty(): boolean {
    return this.entries.length === 0;
  }
  nonEmpty(): boolean {
    return this.entries.length > 0;
  }

  // --- access ---
  get(key: K): Option<V> {
    const i = this.indexOfKey(key);
    return i < 0 ? Option.none<V>() : Option.some(this.entries[i]._2);
  }
  getOrElse(key: K, def: V | (() => V)): V {
    const i = this.indexOfKey(key);
    if (i >= 0) return this.entries[i]._2;
    return typeof def === "function" ? (def as () => V)() : def;
  }
  containsKey(key: K): boolean {
    return this.indexOfKey(key) >= 0;
  }
  apply(key: K): V {
    const i = this.indexOfKey(key);
    if (i < 0) throw new Error(`key not found: ${String(key)}`);
    return this.entries[i]._2;
  }

  // --- mutation (copy-on-write) ---
  put(key: K, value: V): Map<K, V>;
  put(entry: Tuple2<K, V>): Map<K, V>;
  put(keyOrEntry: K | Tuple2<K, V>, value?: V): Map<K, V> {
    let key: K;
    let val: V;
    // Entry form only when called with a single Tuple2 argument; otherwise the
    // first argument is the key (which may itself legitimately be a Tuple2).
    if (arguments.length === 1 && keyOrEntry instanceof Tuple2) {
      key = keyOrEntry._1;
      val = keyOrEntry._2;
    } else {
      key = keyOrEntry as K;
      val = value as V;
    }
    const i = this.indexOfKey(key);
    if (i >= 0) {
      if (equals(this.entries[i]._2, val)) return this;
      const arr = this.entries.slice();
      arr[i] = new Tuple2(key, val);
      return this.rebuild(arr);
    }
    return this.rebuild(this.placeKey(this.entries.slice(), key, val));
  }

  /** put using a merge function when the key already exists. */
  merge(other: Map<K, V>, collision?: (existing: V, incoming: V) => V): Map<K, V> {
    let result: Map<K, V> = this;
    for (const e of other) {
      const i = result.indexOfKey(e._1);
      if (i >= 0 && collision) {
        result = result.put(e._1, collision(result.entries[i]._2, e._2));
      } else if (i < 0) {
        result = result.put(e._1, e._2);
      }
      // else: keep existing (Vavr merge keeps this on collision without fn)
    }
    return result;
  }

  remove(key: K): Map<K, V> {
    const i = this.indexOfKey(key);
    if (i < 0) return this;
    const arr = this.entries.slice();
    arr.splice(i, 1);
    return this.rebuild(arr);
  }

  computeIfAbsent(key: K, supplier: (k: K) => V): Map<K, V> {
    return this.containsKey(key) ? this : this.put(key, supplier(key));
  }

  // --- views ---
  keySet(): VSet<K> {
    return HashSet.ofAll(this.entries.map((e) => e._1));
  }
  keysSeq(): Seq<K> {
    return new Vector(this.entries.map((e) => e._1));
  }
  values(): Seq<V> {
    return new Vector(this.entries.map((e) => e._2));
  }
  toList(): List<Tuple2<K, V>> {
    return new List(this.entries.slice());
  }
  toArray(): Tuple2<K, V>[] {
    return this.entries.slice();
  }
  toStream(): Seq<Tuple2<K, V>> {
    return new Vector(this.entries.slice());
  }

  // --- iteration ---
  [Symbol.iterator](): Iterator<Tuple2<K, V>> {
    return this.entries[Symbol.iterator]();
  }
  iterator(): Iterator<Tuple2<K, V>> & Iterable<Tuple2<K, V>> {
    const it = this.entries[Symbol.iterator]();
    return {
      next: () => it.next(),
      [Symbol.iterator]() {
        return this;
      },
    };
  }
  forEach(fn: (key: K, value: V) => void): void {
    for (const e of this.entries) fn(e._1, e._2);
  }

  // --- functional transforms ---
  map<K2, V2>(fn: (key: K, value: V) => Tuple2<K2, V2>): Map<K2, V2> {
    let result: Map<K2, V2> =
      this.stringName === "TreeMap"
        ? (LinkedHashMap.empty<K2, V2>() as unknown as Map<K2, V2>)
        : (this.emptyOfSameKind<K2, V2>() as Map<K2, V2>);
    for (const e of this.entries) {
      const t = fn(e._1, e._2);
      result = result.put(t._1, t._2);
    }
    return result;
  }
  mapValues<V2>(fn: (value: V) => V2): Map<K, V2> {
    const arr = this.entries.map((e) => new Tuple2(e._1, fn(e._2)));
    return this.emptyOfSameKind<K, V2>().rebuildPublic(arr);
  }
  mapKeys<K2>(fn: (key: K) => K2): Map<K2, V> {
    let result = this.emptyOfSameKind<K2, V>();
    for (const e of this.entries) result = result.put(fn(e._1), e._2);
    return result;
  }
  filter(pred: (key: K, value: V) => boolean): Map<K, V> {
    return this.rebuild(this.entries.filter((e) => pred(e._1, e._2)));
  }
  filterKeys(pred: (key: K) => boolean): Map<K, V> {
    return this.rebuild(this.entries.filter((e) => pred(e._1)));
  }
  filterValues(pred: (value: V) => boolean): Map<K, V> {
    return this.rebuild(this.entries.filter((e) => pred(e._2)));
  }

  find(pred: (entry: Tuple2<K, V>) => boolean): Option<Tuple2<K, V>> {
    for (const e of this.entries) if (pred(e)) return Option.some(e);
    return Option.none<Tuple2<K, V>>();
  }
  exists(pred: (entry: Tuple2<K, V>) => boolean): boolean {
    return this.entries.some((e) => pred(e));
  }
  forAll(pred: (entry: Tuple2<K, V>) => boolean): boolean {
    return this.entries.every((e) => pred(e));
  }
  foldLeft<R>(zero: R, fn: (acc: R, entry: Tuple2<K, V>) => R): R {
    let acc = zero;
    for (const e of this.entries) acc = fn(acc, e);
    return acc;
  }
  count(pred: (entry: Tuple2<K, V>) => boolean): number {
    let c = 0;
    for (const e of this.entries) if (pred(e)) c++;
    return c;
  }
  headOption(): Option<Tuple2<K, V>> {
    return this.entries.length
      ? Option.some(this.entries[0])
      : Option.none<Tuple2<K, V>>();
  }
  get_(): never {
    throw new Error("use get(key)");
  }

  mkString(sep = "", prefix = "", suffix = ""): string {
    return (
      prefix + this.entries.map((e) => `${String(e._1)}=${String(e._2)}`).join(sep) + suffix
    );
  }

  // helpers used by transforms
  protected abstract emptyOfSameKind<K2, V2>(): Map<K2, V2>;
  rebuildPublic(entries: readonly Tuple2<K, V>[]): Map<K, V> {
    return this.rebuild(entries);
  }

  // --- equality (Vavr maps are equal by entries regardless of order, same kind family) ---
  equals(other: unknown): boolean {
    if (this === other) return true;
    if (!(other instanceof Map)) return false;
    if (other.entries.length !== this.entries.length) return false;
    for (const e of this.entries) {
      const i = (other as Map<K, V>).indexOfKey(e._1);
      if (i < 0 || !equals((other as Map<K, V>).entries[i]._2, e._2)) return false;
    }
    return true;
  }
  hashCode(): number {
    // order-independent: sum of entry hashes
    let h = 0;
    for (const e of this.entries) {
      h = (h + combineHash(hashCode(e._1), hashCode(e._2))) | 0;
    }
    return h;
  }
  toString(): string {
    return `${this.stringName}(${this.entries
      .map((e) => `${String(e._1)} -> ${String(e._2)}`)
      .join(", ")})`;
  }
}

/** Insertion-ordered hash map. (Vavr HashMap iterates in hash order; we keep
 *  insertion order for determinism — revisit if output parity requires it.) */
export class HashMap<K, V> extends Map<K, V> {
  protected rebuild(entries: readonly Tuple2<K, V>[]): Map<K, V> {
    return new HashMap<K, V>(entries);
  }
  protected placeKey(entries: Tuple2<K, V>[], key: K, value: V): Tuple2<K, V>[] {
    entries.push(new Tuple2(key, value));
    return entries;
  }
  protected emptyOfSameKind<K2, V2>(): Map<K2, V2> {
    return new HashMap<K2, V2>([]);
  }
  get stringName(): string {
    return "HashMap";
  }
  static empty<K, V>(): HashMap<K, V> {
    return new HashMap<K, V>([]);
  }
  static of<K, V>(...kvs: unknown[]): HashMap<K, V> {
    const entries: Tuple2<K, V>[] = [];
    for (let i = 0; i < kvs.length; i += 2) {
      entries.push(new Tuple2(kvs[i] as K, kvs[i + 1] as V));
    }
    return new HashMap<K, V>(dedupeLast(entries));
  }
  static ofEntries<K, V>(items: Iterable<Tuple2<K, V>>): HashMap<K, V> {
    return new HashMap<K, V>(dedupeLast([...items]));
  }
  /** From a JS object or JS Map. */
  static ofAll<V>(obj: Record<string, V> | globalThis.Map<string, V>): HashMap<string, V> {
    const entries: Tuple2<string, V>[] = [];
    if (obj instanceof globalThis.Map) {
      for (const [k, v] of obj) entries.push(new Tuple2(k, v));
    } else {
      for (const k of Object.keys(obj)) entries.push(new Tuple2(k, obj[k]));
    }
    return new HashMap<string, V>(entries);
  }
}

/** Insertion-ordered map (Vavr LinkedHashMap). */
export class LinkedHashMap<K, V> extends Map<K, V> {
  protected rebuild(entries: readonly Tuple2<K, V>[]): Map<K, V> {
    return new LinkedHashMap<K, V>(entries);
  }
  protected placeKey(entries: Tuple2<K, V>[], key: K, value: V): Tuple2<K, V>[] {
    entries.push(new Tuple2(key, value));
    return entries;
  }
  protected emptyOfSameKind<K2, V2>(): Map<K2, V2> {
    return new LinkedHashMap<K2, V2>([]);
  }
  get stringName(): string {
    return "LinkedHashMap";
  }
  static empty<K, V>(): LinkedHashMap<K, V> {
    return new LinkedHashMap<K, V>([]);
  }
  static of<K, V>(...kvs: unknown[]): LinkedHashMap<K, V> {
    const entries: Tuple2<K, V>[] = [];
    for (let i = 0; i < kvs.length; i += 2) {
      entries.push(new Tuple2(kvs[i] as K, kvs[i + 1] as V));
    }
    return new LinkedHashMap<K, V>(dedupeLast(entries));
  }
  static ofEntries<K, V>(items: Iterable<Tuple2<K, V>>): LinkedHashMap<K, V> {
    return new LinkedHashMap<K, V>(dedupeLast([...items]));
  }
  static ofAll<V>(
    obj: Record<string, V> | globalThis.Map<string, V>,
  ): LinkedHashMap<string, V> {
    const entries: Tuple2<string, V>[] = [];
    if (obj instanceof globalThis.Map) {
      for (const [k, v] of obj) entries.push(new Tuple2(k, v));
    } else {
      for (const k of Object.keys(obj)) entries.push(new Tuple2(k, obj[k]));
    }
    return new LinkedHashMap<string, V>(entries);
  }
}

/** Comparator-ordered map (Vavr TreeMap). */
export class TreeMap<K, V> extends Map<K, V> {
  private readonly comparator: Comparator<K>;
  constructor(entries: readonly Tuple2<K, V>[], comparator: Comparator<K>) {
    super(entries);
    this.comparator = comparator;
  }
  protected rebuild(entries: readonly Tuple2<K, V>[]): Map<K, V> {
    return new TreeMap<K, V>(entries, this.comparator);
  }
  protected placeKey(entries: Tuple2<K, V>[], key: K, value: V): Tuple2<K, V>[] {
    const e = new Tuple2(key, value);
    let lo = 0;
    let hi = entries.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.comparator(entries[mid]._1, key) < 0) lo = mid + 1;
      else hi = mid;
    }
    entries.splice(lo, 0, e);
    return entries;
  }
  protected emptyOfSameKind<K2, V2>(): Map<K2, V2> {
    return new TreeMap<K2, V2>([], this.comparator as unknown as Comparator<K2>);
  }
  get stringName(): string {
    return "TreeMap";
  }
  static empty<K, V>(comparator: Comparator<K>): TreeMap<K, V> {
    return new TreeMap<K, V>([], comparator);
  }
}

function dedupeLast<K, V>(entries: Tuple2<K, V>[]): Tuple2<K, V>[] {
  const out: Tuple2<K, V>[] = [];
  for (const e of entries) {
    const i = out.findIndex((x) => equals(x._1, e._1));
    if (i >= 0) out[i] = e;
    else out.push(e);
  }
  return out;
}

// Wire Seq.groupBy now that Map types exist (avoids circular import at load).
__setGroupByImpl(<T, K>(seq: Seq<T>, keyFn: (v: T) => K): Map<K, Seq<T>> => {
  let result: Map<K, T[]> = LinkedHashMap.empty<K, T[]>();
  for (const v of seq) {
    const k = keyFn(v);
    const existing = result.get(k).getOrNull();
    if (existing) existing.push(v);
    else result = result.put(k, [v]);
  }
  // wrap each group in the same seq kind as source
  return result.map((k, arr) => new Tuple2(k, (seq as any).wrap(arr) as Seq<T>));
});
