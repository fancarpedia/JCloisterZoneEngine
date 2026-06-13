/**
 * Value-equality protocol, mirroring Java's {@code Object.equals}/{@code hashCode}.
 *
 * The whole engine relies on persistent collections keyed by value (Position,
 * FeaturePointer, Edge, meeples, features ...). Every such key type implements
 * {@link Valued}; the shim collections use {@link equals} / {@link hashCode}
 * below for bucketing and comparison.
 */

/** A type that participates in value equality, like a Java object overriding equals/hashCode. */
export interface Valued {
  equals(other: unknown): boolean;
  hashCode(): number;
}

export function isValued(x: unknown): x is Valued {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as Valued).equals === "function" &&
    typeof (x as Valued).hashCode === "function"
  );
}

/** Java String.hashCode. */
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

/** Java-ish hash for a double (good enough; collisions handled by equals). */
export function hashNumber(n: number): number {
  if (Number.isInteger(n)) {
    // Java Integer/Long.hashCode for the common integer case
    return n | 0;
  }
  // Mix the 64-bit representation, like Double.hashCode(value) ^ (value >>> 32)
  const buf = new DataView(new ArrayBuffer(8));
  buf.setFloat64(0, n);
  const hi = buf.getInt32(0);
  const lo = buf.getInt32(4);
  return (hi ^ lo) | 0;
}

export function hashBoolean(b: boolean): number {
  return b ? 1231 : 1237;
}

/** Structural hash of an arbitrary value used as a collection key or element. */
export function hashCode(x: unknown): number {
  if (x === null || x === undefined) return 0;
  if (isValued(x)) return x.hashCode() | 0;
  switch (typeof x) {
    case "number":
      return hashNumber(x);
    case "string":
      return hashString(x);
    case "boolean":
      return hashBoolean(x);
    case "bigint":
      return Number(BigInt.asIntN(32, x));
    default:
      // Objects without value semantics fall back to identity; we cannot derive
      // a stable hash, so use a lazily-attached identity tag.
      return identityHash(x as object);
  }
}

/** Value equality between two arbitrary values. */
export function equals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  if (isValued(a)) return a.equals(b);
  if (isValued(b)) return b.equals(a);
  // Numbers, strings, booleans already handled by === above.
  return false;
}

// --- identity hashing for non-valued object keys (rare; e.g. Class tokens) ---

let identityCounter = 0;
const identityTag = Symbol("jcz.identityHash");

function identityHash(obj: object): number {
  const existing = (obj as Record<symbol, number>)[identityTag];
  if (existing !== undefined) return existing;
  const h = (identityCounter = (identityCounter + 0x9e3779b1) | 0);
  Object.defineProperty(obj, identityTag, {
    value: h,
    enumerable: false,
    writable: false,
    configurable: false,
  });
  return h;
}

/** Combine hashes the way Java's Objects.hash / List.hashCode does. */
export function combineHash(...parts: number[]): number {
  let h = 1;
  for (const p of parts) {
    h = (Math.imul(31, h) + (p | 0)) | 0;
  }
  return h;
}
