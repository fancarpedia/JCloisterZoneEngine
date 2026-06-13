/** io.vavr functional interface shims as plain TS function types. */

export type Function0<R> = () => R;
export type Function1<A, R> = (a: A) => R;
export type Function2<A, B, R> = (a: A, b: B) => R;
export type Function3<A, B, C, R> = (a: A, b: B, c: C) => R;

export type Consumer<A> = (a: A) => void;
export type BiConsumer<A, B> = (a: A, b: B) => void;
export type Supplier<R> = () => R;
