import { Valued, equals, hashCode } from "./equality.js";

/**
 * Vavr Option. Mirrors the subset used by the engine: get/getOrNull/getOrElse,
 * map/flatMap/filter/forEach/peek, isDefined/isEmpty, orElse.
 */
export class Option<T> implements Iterable<T>, Valued {
  private constructor(
    private readonly present: boolean,
    private readonly value: T | undefined,
  ) {}

  private static readonly NONE = new Option<never>(false, undefined);

  static some<T>(value: T): Option<T> {
    return new Option<T>(true, value);
  }

  static none<T = never>(): Option<T> {
    return Option.NONE as Option<T>;
  }

  /** none() when value is null/undefined, otherwise some(value). */
  static of<T>(value: T | null | undefined): Option<T> {
    return value === null || value === undefined
      ? Option.none<T>()
      : Option.some(value);
  }

  /** some(value) only when the condition holds. */
  static when<T>(condition: boolean, value: T): Option<T> {
    return condition ? Option.some(value) : Option.none<T>();
  }

  isDefined(): boolean {
    return this.present;
  }

  isEmpty(): boolean {
    return !this.present;
  }

  get(): T {
    if (!this.present) throw new Error("No value present (Option.none)");
    return this.value as T;
  }

  getOrNull(): T | null {
    return this.present ? (this.value as T) : null;
  }

  getOrElse(other: T | (() => T)): T {
    if (this.present) return this.value as T;
    return typeof other === "function" ? (other as () => T)() : other;
  }

  getOrElseThrow(supplier: () => Error): T {
    if (this.present) return this.value as T;
    throw supplier();
  }

  orElse(other: Option<T> | (() => Option<T>)): Option<T> {
    if (this.present) return this;
    return typeof other === "function" ? (other as () => Option<T>)() : other;
  }

  map<R>(fn: (v: T) => R): Option<R> {
    return this.present ? Option.some(fn(this.value as T)) : Option.none<R>();
  }

  flatMap<R>(fn: (v: T) => Option<R>): Option<R> {
    return this.present ? fn(this.value as T) : Option.none<R>();
  }

  filter(pred: (v: T) => boolean): Option<T> {
    if (this.present && pred(this.value as T)) return this;
    return Option.none<T>();
  }

  forEach(fn: (v: T) => void): void {
    if (this.present) fn(this.value as T);
  }

  /** Side-effecting tap returning this. */
  peek(fn: (v: T) => void): Option<T> {
    if (this.present) fn(this.value as T);
    return this;
  }

  exists(pred: (v: T) => boolean): boolean {
    return this.present && pred(this.value as T);
  }

  toArray(): T[] {
    return this.present ? [this.value as T] : [];
  }

  *[Symbol.iterator](): Iterator<T> {
    if (this.present) yield this.value as T;
  }

  equals(other: unknown): boolean {
    if (this === other) return true;
    if (!(other instanceof Option)) return false;
    if (this.present !== other.present) return false;
    return !this.present || equals(this.value, other.value);
  }

  hashCode(): number {
    return this.present ? hashCode(this.value) : 0;
  }

  toString(): string {
    return this.present ? `Some(${String(this.value)})` : "None";
  }
}
