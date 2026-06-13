import { Seq } from "./Seq.js";

/**
 * Concrete persistent sequence kinds. They share all behaviour from {@link Seq};
 * they differ only by identity/kind (so a List never equals a Vector, matching
 * Vavr) and by which kind transformations rebuild into.
 *
 * Note: Vavr's `Array` is named {@link Arr} here to avoid clashing with the JS
 * global `Array`.
 */

export class List<T> extends Seq<T> {
  protected wrap<U>(items: readonly U[]): Seq<U> {
    return new List<U>(items);
  }
  get stringName(): string {
    return "List";
  }
  static empty<T>(): List<T> {
    return new List<T>([]);
  }
  static of<T>(...items: T[]): List<T> {
    return new List<T>(items);
  }
  static ofAll<T>(items: Iterable<T>): List<T> {
    return new List<T>([...items]);
  }
  /** Vavr List.narrow — covariance helper, identity at runtime. */
  static narrow<T>(list: List<T>): List<T> {
    return list;
  }
}

export class Vector<T> extends Seq<T> {
  protected wrap<U>(items: readonly U[]): Seq<U> {
    return new Vector<U>(items);
  }
  get stringName(): string {
    return "Vector";
  }
  static empty<T>(): Vector<T> {
    return new Vector<T>([]);
  }
  static of<T>(...items: T[]): Vector<T> {
    return new Vector<T>(items);
  }
  static ofAll<T>(items: Iterable<T>): Vector<T> {
    return new Vector<T>([...items]);
  }
  static fill<T>(n: number, supplier: (i: number) => T): Vector<T> {
    const arr: T[] = [];
    for (let i = 0; i < n; i++) arr.push(supplier(i));
    return new Vector<T>(arr);
  }
  static range(start: number, endExclusive: number): Vector<number> {
    const arr: number[] = [];
    for (let i = start; i < endExclusive; i++) arr.push(i);
    return new Vector<number>(arr);
  }
  static rangeClosed(start: number, endInclusive: number): Vector<number> {
    const arr: number[] = [];
    for (let i = start; i <= endInclusive; i++) arr.push(i);
    return new Vector<number>(arr);
  }
}

/** Vavr Array (renamed to avoid the JS global). */
export class Arr<T> extends Seq<T> {
  protected wrap<U>(items: readonly U[]): Seq<U> {
    return new Arr<U>(items);
  }
  get stringName(): string {
    return "Array";
  }
  static empty<T>(): Arr<T> {
    return new Arr<T>([]);
  }
  static of<T>(...items: T[]): Arr<T> {
    return new Arr<T>(items);
  }
  static ofAll<T>(items: Iterable<T>): Arr<T> {
    return new Arr<T>([...items]);
  }
  static fill<T>(n: number, supplier: (i: number) => T): Arr<T> {
    const arr: T[] = [];
    for (let i = 0; i < n; i++) arr.push(supplier(i));
    return new Arr<T>(arr);
  }
  static range(start: number, endExclusive: number): Arr<number> {
    const arr: number[] = [];
    for (let i = start; i < endExclusive; i++) arr.push(i);
    return new Arr<number>(arr);
  }
}

export class Queue<T> extends Seq<T> {
  protected wrap<U>(items: readonly U[]): Seq<U> {
    return new Queue<U>(items);
  }
  get stringName(): string {
    return "Queue";
  }
  /** Enqueue (Vavr Queue.enqueue appends to the back). */
  enqueue(value: T): Queue<T> {
    return new Queue<T>([...this.items, value]);
  }
  enqueueAll(values: Iterable<T>): Queue<T> {
    return new Queue<T>([...this.items, ...values]);
  }
  /** Dequeue from the front; returns [head, rest]. */
  dequeue(): [T, Queue<T>] {
    if (this.isEmpty()) throw new Error("dequeue of empty queue");
    return [this.items[0], new Queue<T>(this.items.slice(1))];
  }
  static empty<T>(): Queue<T> {
    return new Queue<T>([]);
  }
  static of<T>(...items: T[]): Queue<T> {
    return new Queue<T>(items);
  }
  static ofAll<T>(items: Iterable<T>): Queue<T> {
    return new Queue<T>([...items]);
  }
}

/**
 * Vavr Stream. Implemented eagerly (array-backed): behaviourally identical to the
 * lazy stream for the finite, pure pipelines the engine uses.
 */
export class Stream<T> extends Seq<T> {
  protected wrap<U>(items: readonly U[]): Seq<U> {
    return new Stream<U>(items);
  }
  get stringName(): string {
    return "Stream";
  }
  static empty<T>(): Stream<T> {
    return new Stream<T>([]);
  }
  static of<T>(...items: T[]): Stream<T> {
    return new Stream<T>(items);
  }
  static ofAll<T>(items: Iterable<T>): Stream<T> {
    return new Stream<T>([...items]);
  }
  static concat<T>(...sources: Iterable<T>[]): Stream<T> {
    const out: T[] = [];
    for (const s of sources) for (const v of s) out.push(v);
    return new Stream<T>(out);
  }
  static range(start: number, endExclusive: number): Stream<number> {
    const arr: number[] = [];
    for (let i = start; i < endExclusive; i++) arr.push(i);
    return new Stream<number>(arr);
  }
  static rangeClosed(start: number, endInclusive: number): Stream<number> {
    const arr: number[] = [];
    for (let i = start; i <= endInclusive; i++) arr.push(i);
    return new Stream<number>(arr);
  }
}
