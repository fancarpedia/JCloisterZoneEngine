/**
 * Helpers standing in for Java Class<?> tokens. A "class token" is just the TS
 * class constructor; we add Java-style reflection helpers used by the engine
 * (getSimpleName, isAssignableFrom).
 *
 * IMPORTANT: serialization keys off simple class names (e.g. "City", "Road").
 * To stay robust under minification, classes may expose a static `simpleName`;
 * otherwise the constructor's `.name` is used.
 */
export type ClassToken<T = unknown> = abstract new (...args: any[]) => T;
export type AnyClass = Function;

export function simpleName(cls: AnyClass): string {
  const explicit = (cls as { simpleName?: string }).simpleName;
  return explicit ?? cls.name;
}

/** Java's parent.isAssignableFrom(child): child is parent or a subclass. */
export function isAssignableFrom(parent: AnyClass, child: AnyClass | null | undefined): boolean {
  if (!child) return false;
  if (child === parent) return true;
  return child.prototype instanceof (parent as new (...a: any[]) => unknown);
}
