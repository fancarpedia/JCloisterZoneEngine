import { Valued, combineHash, equals, hashCode } from "./equality.js";

/** Vavr Tuple2. Value-equal so it can be used as a map/set key. */
export class Tuple2<T1, T2> implements Valued {
  constructor(
    public readonly _1: T1,
    public readonly _2: T2,
  ) {}

  static of<A, B>(a: A, b: B): Tuple2<A, B> {
    return new Tuple2(a, b);
  }

  map1<R>(fn: (v: T1) => R): Tuple2<R, T2> {
    return new Tuple2(fn(this._1), this._2);
  }

  map2<R>(fn: (v: T2) => R): Tuple2<T1, R> {
    return new Tuple2(this._1, fn(this._2));
  }

  map<R1, R2>(fn1: (v: T1) => R1, fn2: (v: T2) => R2): Tuple2<R1, R2> {
    return new Tuple2(fn1(this._1), fn2(this._2));
  }

  update1<R>(v: R): Tuple2<R, T2> {
    return new Tuple2(v, this._2);
  }

  update2<R>(v: R): Tuple2<T1, R> {
    return new Tuple2(this._1, v);
  }

  apply<R>(fn: (a: T1, b: T2) => R): R {
    return fn(this._1, this._2);
  }

  equals(other: unknown): boolean {
    if (this === other) return true;
    if (!(other instanceof Tuple2)) return false;
    return equals(this._1, other._1) && equals(this._2, other._2);
  }

  hashCode(): number {
    return combineHash(hashCode(this._1), hashCode(this._2));
  }

  toString(): string {
    return `(${String(this._1)}, ${String(this._2)})`;
  }
}

/** Vavr Tuple3. */
export class Tuple3<T1, T2, T3> implements Valued {
  constructor(
    public readonly _1: T1,
    public readonly _2: T2,
    public readonly _3: T3,
  ) {}

  static of<A, B, C>(a: A, b: B, c: C): Tuple3<A, B, C> {
    return new Tuple3(a, b, c);
  }

  map1<R>(fn: (v: T1) => R): Tuple3<R, T2, T3> {
    return new Tuple3(fn(this._1), this._2, this._3);
  }

  map2<R>(fn: (v: T2) => R): Tuple3<T1, R, T3> {
    return new Tuple3(this._1, fn(this._2), this._3);
  }

  map3<R>(fn: (v: T3) => R): Tuple3<T1, T2, R> {
    return new Tuple3(this._1, this._2, fn(this._3));
  }

  update1<R>(v: R): Tuple3<R, T2, T3> {
    return new Tuple3(v, this._2, this._3);
  }

  update2<R>(v: R): Tuple3<T1, R, T3> {
    return new Tuple3(this._1, v, this._3);
  }

  update3<R>(v: R): Tuple3<T1, T2, R> {
    return new Tuple3(this._1, this._2, v);
  }

  equals(other: unknown): boolean {
    if (this === other) return true;
    if (!(other instanceof Tuple3)) return false;
    return (
      equals(this._1, other._1) &&
      equals(this._2, other._2) &&
      equals(this._3, other._3)
    );
  }

  hashCode(): number {
    return combineHash(hashCode(this._1), hashCode(this._2), hashCode(this._3));
  }

  toString(): string {
    return `(${String(this._1)}, ${String(this._2)}, ${String(this._3)})`;
  }
}

export function Tuple<A, B>(a: A, b: B): Tuple2<A, B>;
export function Tuple<A, B, C>(a: A, b: B, c: C): Tuple3<A, B, C>;
export function Tuple(a: unknown, b: unknown, c?: unknown): unknown {
  return arguments.length === 3 ? new Tuple3(a, b, c) : new Tuple2(a, b);
}
