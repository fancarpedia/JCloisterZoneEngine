import { Valued, equals, hashCode } from "./equality.js";
import { Option } from "./Option.js";
import { Seq } from "./Seq.js";
import { List, Vector } from "./SeqTypes.js";

/**
 * Persistent set with value-equality elements. Insertion-ordered (Vavr HashSet
 * iterates in hash order; we keep insertion order for determinism). Copy-on-write.
 */
export abstract class Set<T> implements Iterable<T>, Valued {
  protected readonly items: readonly T[];
  private index: globalThis.Map<number, number[]> | null = null;

  constructor(items: readonly T[]) {
    this.items = items;
  }

  protected abstract rebuild(items: readonly T[]): Set<T>;
  abstract get stringName(): string;

  private getIndex(): globalThis.Map<number, number[]> {
    if (this.index === null) {
      const idx = new globalThis.Map<number, number[]>();
      this.items.forEach((v, i) => {
        const h = hashCode(v);
        const bucket = idx.get(h);
        if (bucket) bucket.push(i);
        else idx.set(h, [i]);
      });
      this.index = idx;
    }
    return this.index;
  }

  private indexOf(value: T): number {
    const bucket = this.getIndex().get(hashCode(value));
    if (!bucket) return -1;
    for (const i of bucket) if (equals(this.items[i], value)) return i;
    return -1;
  }

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
  contains(value: T): boolean {
    return this.indexOf(value) >= 0;
  }

  add(value: T): Set<T> {
    if (this.contains(value)) return this;
    return this.rebuild([...this.items, value]);
  }
  addAll(values: Iterable<T>): Set<T> {
    let result: Set<T> = this;
    for (const v of values) result = result.add(v);
    return result;
  }
  union(other: Set<T>): Set<T> {
    return this.addAll(other);
  }
  remove(value: T): Set<T> {
    const i = this.indexOf(value);
    if (i < 0) return this;
    const arr = this.items.slice();
    arr.splice(i, 1);
    return this.rebuild(arr);
  }
  removeAll(values: Iterable<T>): Set<T> {
    let result: Set<T> = this;
    for (const v of values) result = result.remove(v);
    return result;
  }
  diff(other: Set<T>): Set<T> {
    return this.rebuild(this.items.filter((v) => !other.contains(v)));
  }
  intersect(other: Set<T>): Set<T> {
    return this.rebuild(this.items.filter((v) => other.contains(v)));
  }

  head(): T {
    if (this.isEmpty()) throw new Error("head of empty set");
    return this.items[0];
  }
  headOption(): Option<T> {
    return this.isEmpty() ? Option.none<T>() : Option.some(this.items[0]);
  }
  find(pred: (v: T) => boolean): Option<T> {
    for (const v of this.items) if (pred(v)) return Option.some(v);
    return Option.none<T>();
  }
  exists(pred: (v: T) => boolean): boolean {
    return this.items.some((v) => pred(v));
  }
  forAll(pred: (v: T) => boolean): boolean {
    return this.items.every((v) => pred(v));
  }
  count(pred: (v: T) => boolean): number {
    let c = 0;
    for (const v of this.items) if (pred(v)) c++;
    return c;
  }

  map<R>(fn: (v: T) => R): Set<R> {
    return HashSet.ofAll(this.items.map((v) => fn(v)));
  }
  flatMap<R>(fn: (v: T) => Iterable<R>): Set<R> {
    const out: R[] = [];
    for (const v of this.items) for (const r of fn(v)) out.push(r);
    return HashSet.ofAll(out);
  }
  filter(pred: (v: T) => boolean): Set<T> {
    return this.rebuild(this.items.filter((v) => pred(v)));
  }
  filterNot(pred: (v: T) => boolean): Set<T> {
    return this.rebuild(this.items.filter((v) => !pred(v)));
  }
  forEach(fn: (v: T) => void): void {
    for (const v of this.items) fn(v);
  }
  foldLeft<R>(zero: R, fn: (acc: R, v: T) => R): R {
    let acc = zero;
    for (const v of this.items) acc = fn(acc, v);
    return acc;
  }

  toArray(): T[] {
    return this.items.slice();
  }
  toList(): List<T> {
    return new List(this.items.slice());
  }
  toVector(): Vector<T> {
    return new Vector(this.items.slice());
  }
  toSeq(): Seq<T> {
    return new Vector(this.items.slice());
  }
  mkString(sep = "", prefix = "", suffix = ""): string {
    return prefix + this.items.map((v) => String(v)).join(sep) + suffix;
  }

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

  equals(other: unknown): boolean {
    if (this === other) return true;
    if (!(other instanceof Set)) return false;
    if (other.items.length !== this.items.length) return false;
    for (const v of this.items) if (!other.contains(v)) return false;
    return true;
  }
  hashCode(): number {
    let h = 0;
    for (const v of this.items) h = (h + hashCode(v)) | 0; // order-independent
    return h;
  }
  toString(): string {
    return `${this.stringName}(${this.items.map((v) => String(v)).join(", ")})`;
  }
}

export class HashSet<T> extends Set<T> {
  protected rebuild(items: readonly T[]): Set<T> {
    return new HashSet<T>(items);
  }
  get stringName(): string {
    return "HashSet";
  }
  static empty<T>(): HashSet<T> {
    return new HashSet<T>([]);
  }
  static of<T>(...items: T[]): HashSet<T> {
    return HashSet.ofAll(items);
  }
  static ofAll<T>(items: Iterable<T>): HashSet<T> {
    const out: T[] = [];
    const seen = new HashSet<T>([]);
    let s: Set<T> = seen;
    for (const v of items) {
      if (!s.contains(v)) {
        s = s.add(v);
        out.push(v);
      }
    }
    return new HashSet<T>(out);
  }
}
