import { Valued, combineHash, equals, hashCode } from "./equality.js";
import { Option } from "./Option.js";
import { Tuple2 } from "./Tuple.js";

export type Comparator<T> = (a: T, b: T) => number;

const naturalComparator: Comparator<any> = (a, b) => {
  if (isValued(a) && typeof (a as any).compareTo === "function") {
    return (a as any).compareTo(b);
  }
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
};

function isValued(x: unknown): x is Valued {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as Valued).equals === "function"
  );
}

/**
 * Array-backed persistent sequence. Concrete subclasses (List, Vector, Array,
 * Queue, Stream) only differ by the wrapper they rebuild into; all transformation
 * logic lives here. Copy-on-write: every mutating op returns a new instance.
 */
export abstract class Seq<T> implements Iterable<T>, Valued {
  protected readonly items: readonly T[];

  constructor(items: readonly T[]) {
    this.items = items;
  }

  /** Rebuild a sequence of the same concrete kind. */
  protected abstract wrap<U>(items: readonly U[]): Seq<U>;

  abstract get stringName(): string;

  // --- size / access ---
  size(): number {
    return this.items.length;
  }
  length(): number {
    return this.items.length;
  }
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  nonEmpty(): boolean {
    return this.items.length > 0;
  }
  get(index: number): T {
    return this.items[index];
  }
  /** Vavr single-arg get() (head) is via get(); .get() with no index = head in some APIs. */
  head(): T {
    if (this.isEmpty()) throw new Error("head of empty sequence");
    return this.items[0];
  }
  headOption(): Option<T> {
    return this.isEmpty() ? Option.none<T>() : Option.some(this.items[0]);
  }
  /** Vavr Value.getOrNull(): head element or null when empty. */
  getOrNull(): T | null {
    return this.isEmpty() ? null : this.items[0];
  }
  last(): T {
    if (this.isEmpty()) throw new Error("last of empty sequence");
    return this.items[this.items.length - 1];
  }
  lastOption(): Option<T> {
    return this.isEmpty()
      ? Option.none<T>()
      : Option.some(this.items[this.items.length - 1]);
  }
  tail(): Seq<T> {
    if (this.isEmpty()) throw new Error("tail of empty sequence");
    return this.wrap(this.items.slice(1));
  }
  init(): Seq<T> {
    if (this.isEmpty()) throw new Error("init of empty sequence");
    return this.wrap(this.items.slice(0, -1));
  }
  /** Vavr single() — the only element, error otherwise. */
  single(): T {
    if (this.items.length !== 1)
      throw new Error(`single() on sequence of size ${this.items.length}`);
    return this.items[0];
  }
  singleOption(): Option<T> {
    return this.items.length === 1
      ? Option.some(this.items[0])
      : Option.none<T>();
  }
  indexOf(value: T): number {
    for (let i = 0; i < this.items.length; i++) {
      if (equals(this.items[i], value)) return i;
    }
    return -1;
  }

  // --- iteration ---
  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }
  iterator(): Iterator<T> & Iterable<T> {
    const it = this.items[Symbol.iterator]();
    return {
      next: () => it.next(),
      [Symbol.iterator]() {
        return this;
      },
    };
  }
  forEach(fn: (v: T, index: number) => void): void {
    this.items.forEach((v, i) => fn(v, i));
  }

  // --- transforms ---
  map<R>(fn: (v: T, index: number) => R): Seq<R> {
    return this.wrap(this.items.map((v, i) => fn(v, i)));
  }
  flatMap<R>(fn: (v: T) => Iterable<R>): Seq<R> {
    const out: R[] = [];
    for (const v of this.items) for (const r of fn(v)) out.push(r);
    return this.wrap(out);
  }
  filter(pred: (v: T) => boolean): Seq<T> {
    return this.wrap(this.items.filter((v) => pred(v)));
  }
  filterNot(pred: (v: T) => boolean): Seq<T> {
    return this.wrap(this.items.filter((v) => !pred(v)));
  }
  collect<R>(fn: (v: T) => Option<R>): Seq<R> {
    const out: R[] = [];
    for (const v of this.items) {
      const o = fn(v);
      if (o.isDefined()) out.push(o.get());
    }
    return this.wrap(out);
  }
  distinct(): Seq<T> {
    const out: T[] = [];
    for (const v of this.items) {
      if (!out.some((x) => equals(x, v))) out.push(v);
    }
    return this.wrap(out);
  }
  distinctBy<K>(keyFn: (v: T) => K): Seq<T> {
    const seen: K[] = [];
    const out: T[] = [];
    for (const v of this.items) {
      const k = keyFn(v);
      if (!seen.some((x) => equals(x, k))) {
        seen.push(k);
        out.push(v);
      }
    }
    return this.wrap(out);
  }
  peek(fn: (v: T) => void): Seq<T> {
    if (this.nonEmpty()) fn(this.items[0]);
    return this;
  }

  // --- predicates / search ---
  find(pred: (v: T) => boolean): Option<T> {
    for (const v of this.items) if (pred(v)) return Option.some(v);
    return Option.none<T>();
  }
  findLast(pred: (v: T) => boolean): Option<T> {
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (pred(this.items[i])) return Option.some(this.items[i]);
    }
    return Option.none<T>();
  }
  exists(pred: (v: T) => boolean): boolean {
    return this.items.some((v) => pred(v));
  }
  forAll(pred: (v: T) => boolean): boolean {
    return this.items.every((v) => pred(v));
  }
  contains(value: T): boolean {
    return this.indexOf(value) >= 0;
  }
  count(pred: (v: T) => boolean): number {
    let c = 0;
    for (const v of this.items) if (pred(v)) c++;
    return c;
  }

  // --- folds ---
  foldLeft<R>(zero: R, fn: (acc: R, v: T) => R): R {
    let acc = zero;
    for (const v of this.items) acc = fn(acc, v);
    return acc;
  }
  foldRight<R>(zero: R, fn: (v: T, acc: R) => R): R {
    let acc = zero;
    for (let i = this.items.length - 1; i >= 0; i--) acc = fn(this.items[i], acc);
    return acc;
  }
  reduce(fn: (a: T, b: T) => T): T {
    return this.reduceLeft(fn);
  }
  reduceLeft(fn: (a: T, b: T) => T): T {
    if (this.isEmpty()) throw new Error("reduceLeft of empty sequence");
    let acc = this.items[0];
    for (let i = 1; i < this.items.length; i++) acc = fn(acc, this.items[i]);
    return acc;
  }
  reduceLeftOption(fn: (a: T, b: T) => T): Option<T> {
    return this.isEmpty() ? Option.none<T>() : Option.some(this.reduceLeft(fn));
  }

  // --- numeric helpers (Vavr sum/max/min over comparables) ---
  sum(): number {
    return this.items.reduce((a, v) => a + (v as unknown as number), 0);
  }
  maxBy<R>(fn: (v: T) => R): Option<T> {
    if (this.isEmpty()) return Option.none<T>();
    let best = this.items[0];
    let bestK = fn(best);
    for (let i = 1; i < this.items.length; i++) {
      const k = fn(this.items[i]);
      if (naturalComparator(k, bestK) > 0) {
        best = this.items[i];
        bestK = k;
      }
    }
    return Option.some(best);
  }
  minBy<R>(fn: (v: T) => R): Option<T> {
    if (this.isEmpty()) return Option.none<T>();
    let best = this.items[0];
    let bestK = fn(best);
    for (let i = 1; i < this.items.length; i++) {
      const k = fn(this.items[i]);
      if (naturalComparator(k, bestK) < 0) {
        best = this.items[i];
        bestK = k;
      }
    }
    return Option.some(best);
  }

  // --- ordering ---
  sorted(comparator: Comparator<T> = naturalComparator): Seq<T> {
    return this.wrap([...this.items].sort(comparator));
  }
  sortBy<R>(fn: (v: T) => R, comparator: Comparator<R> = naturalComparator): Seq<T> {
    return this.wrap(
      [...this.items].sort((a, b) => comparator(fn(a), fn(b))),
    );
  }
  reverse(): Seq<T> {
    return this.wrap([...this.items].reverse());
  }

  // --- slicing ---
  take(n: number): Seq<T> {
    return this.wrap(this.items.slice(0, Math.max(0, n)));
  }
  takeRight(n: number): Seq<T> {
    return this.wrap(n <= 0 ? [] : this.items.slice(-n));
  }
  takeWhile(pred: (v: T) => boolean): Seq<T> {
    const out: T[] = [];
    for (const v of this.items) {
      if (!pred(v)) break;
      out.push(v);
    }
    return this.wrap(out);
  }
  drop(n: number): Seq<T> {
    return this.wrap(this.items.slice(Math.max(0, n)));
  }
  dropRight(n: number): Seq<T> {
    return this.wrap(n <= 0 ? this.items.slice() : this.items.slice(0, -n));
  }
  dropWhile(pred: (v: T) => boolean): Seq<T> {
    let i = 0;
    while (i < this.items.length && pred(this.items[i])) i++;
    return this.wrap(this.items.slice(i));
  }
  slice(begin: number, end: number): Seq<T> {
    return this.wrap(this.items.slice(begin, end));
  }
  subSequence(begin: number, end?: number): Seq<T> {
    return this.wrap(this.items.slice(begin, end));
  }

  // --- building ---
  append(value: T): Seq<T> {
    return this.wrap([...this.items, value]);
  }
  appendAll(values: Iterable<T>): Seq<T> {
    return this.wrap([...this.items, ...values]);
  }
  prepend(value: T): Seq<T> {
    return this.wrap([value, ...this.items]);
  }
  prependAll(values: Iterable<T>): Seq<T> {
    return this.wrap([...values, ...this.items]);
  }
  insert(index: number, value: T): Seq<T> {
    const arr = this.items.slice();
    arr.splice(index, 0, value);
    return this.wrap(arr);
  }
  update(index: number, value: T): Seq<T> {
    const arr = this.items.slice();
    arr[index] = value;
    return this.wrap(arr);
  }
  /** Remove first element equal to value. */
  remove(value: T): Seq<T> {
    const idx = this.indexOf(value);
    if (idx < 0) return this;
    return this.removeAt(idx);
  }
  removeAt(index: number): Seq<T> {
    const arr = this.items.slice();
    arr.splice(index, 1);
    return this.wrap(arr);
  }
  /** Remove the first element matching the predicate. */
  removeFirst(pred: (v: T) => boolean): Seq<T> {
    const idx = this.items.findIndex((v) => pred(v));
    if (idx < 0) return this;
    return this.removeAt(idx);
  }
  removeAll(pred: (v: T) => boolean): Seq<T> {
    return this.wrap(this.items.filter((v) => !pred(v)));
  }

  // --- grouping / zipping ---
  zipWithIndex(): Seq<Tuple2<T, number>> {
    return this.wrap(this.items.map((v, i) => new Tuple2(v, i)));
  }
  zip<U>(other: Iterable<U>): Seq<Tuple2<T, U>> {
    const out: Tuple2<T, U>[] = [];
    const it = other[Symbol.iterator]();
    for (const v of this.items) {
      const n = it.next();
      if (n.done) break;
      out.push(new Tuple2(v, n.value));
    }
    return this.wrap(out);
  }
  groupBy<K>(keyFn: (v: T) => K): import("./Map.js").Map<K, Seq<T>> {
    // Lazy import avoided via require-like pattern; implemented in Map.ts re-export.
    return groupByImpl(this, keyFn);
  }
  partition(pred: (v: T) => boolean): Tuple2<Seq<T>, Seq<T>> {
    const yes: T[] = [];
    const no: T[] = [];
    for (const v of this.items) (pred(v) ? yes : no).push(v);
    return new Tuple2(this.wrap(yes), this.wrap(no));
  }

  // --- conversions ---
  toArray(): T[] {
    return this.items.slice();
  }
  toJsArray(): T[] {
    return this.items.slice();
  }
  mkString(sep = "", prefix = "", suffix = ""): string {
    return prefix + this.items.map((v) => String(v)).join(sep) + suffix;
  }

  // --- equality (Vavr seq equality is element-wise, type-sensitive across kinds) ---
  equals(other: unknown): boolean {
    if (this === other) return true;
    if (!(other instanceof Seq)) return false;
    if (other.stringName !== this.stringName) return false;
    if (other.items.length !== this.items.length) return false;
    for (let i = 0; i < this.items.length; i++) {
      if (!equals(this.items[i], other.items[i])) return false;
    }
    return true;
  }
  hashCode(): number {
    return combineHash(...this.items.map((v) => hashCode(v)));
  }
  toString(): string {
    return `${this.stringName}(${this.items.map((v) => String(v)).join(", ")})`;
  }
}

// groupBy implementation hook, set by Map.ts to avoid a circular import at module load.
let groupByImpl: <T, K>(
  seq: Seq<T>,
  keyFn: (v: T) => K,
) => import("./Map.js").Map<K, Seq<T>>;

export function __setGroupByImpl(
  fn: <T, K>(seq: Seq<T>, keyFn: (v: T) => K) => import("./Map.js").Map<K, Seq<T>>,
): void {
  groupByImpl = fn;
}
