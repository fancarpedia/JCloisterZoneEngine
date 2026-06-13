import { Valued, hashString } from "../io/vavr/equality.js";

/**
 * Base for ported Java enums. Constants are singletons, so equality is identity;
 * hashCode is the (stable) ordinal so enums work as deterministic map/set keys.
 *
 * Call sites use Java-style accessor methods: `name()`, `ordinal()`.
 */
export abstract class JavaEnum implements Valued {
  constructor(
    private readonly _name: string,
    private readonly _ordinal: number,
  ) {}

  name(): string {
    return this._name;
  }

  ordinal(): number {
    return this._ordinal;
  }

  equals(other: unknown): boolean {
    return this === other;
  }

  hashCode(): number {
    return this._ordinal;
  }

  toString(): string {
    return this._name;
  }
}

/** Helper for Java's Enum.valueOf(name): looks up by name in a constants array. */
export function enumValueOf<T extends JavaEnum>(values: readonly T[], name: string): T {
  const found = values.find((v) => v.name() === name);
  if (!found) throw new Error(`No enum constant for name ${name}`);
  return found;
}

export { hashString };
