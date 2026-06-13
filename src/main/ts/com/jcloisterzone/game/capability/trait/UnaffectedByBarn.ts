/**
 * Trait: figure unaffected by the Barn (Barn, Shepherd, fan figures). Mirrors Java
 * {@code instanceof UnaffectedByBarn} via a compiler-enforced marker method.
 */
export interface UnaffectedByBarn {
  isUnaffectedByBarn(): true;
}

export function isInstanceOfUnaffectedByBarn(f: unknown): f is UnaffectedByBarn {
  return typeof (f as { isUnaffectedByBarn?: unknown } | null)?.isUnaffectedByBarn === "function";
}
