/**
 * Trait: feature a Builder may extend (City, Road). Mirrors Java
 * {@code instanceof BuilderExtendable} via a compiler-enforced marker method.
 */
export interface BuilderExtendable {
  isBuilderExtendable(): true;
}

export function isInstanceOfBuilderExtendable(f: unknown): f is BuilderExtendable {
  return typeof (f as { isBuilderExtendable?: unknown } | null)?.isBuilderExtendable === "function";
}
