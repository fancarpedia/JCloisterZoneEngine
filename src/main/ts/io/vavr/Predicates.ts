/** Subset of io.vavr.Predicates used by the engine. */

export type Predicate<T> = (value: T) => boolean;

export interface Ctor<T> {
  new (...args: any[]): T;
}

export const Predicates = {
  isNull<T>(): Predicate<T | null | undefined> {
    return (v) => v === null || v === undefined;
  },
  isNotNull<T>(): Predicate<T | null | undefined> {
    return (v) => v !== null && v !== undefined;
  },
  instanceOf<T>(cls: Ctor<T>): Predicate<unknown> {
    return (v) => v instanceof cls;
  },
  is<T>(value: T): Predicate<T> {
    return (v) => v === value;
  },
  not<T>(p: Predicate<T>): Predicate<T> {
    return (v) => !p(v);
  },
  allOf<T>(...ps: Predicate<T>[]): Predicate<T> {
    return (v) => ps.every((p) => p(v));
  },
  anyOf<T>(...ps: Predicate<T>[]): Predicate<T> {
    return (v) => ps.some((p) => p(v));
  },
} as const;
