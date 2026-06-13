/** Marker trait: a figure protected from meteorite impact (e.g. the Count). Duck-typed (Java
 *  models it as an empty interface; TS interfaces are erased, so use {@link isInstanceOfMeteoriteProtected}). */
export interface MeteoriteProtected {
  readonly meteoriteProtected: true;
}

export function isInstanceOfMeteoriteProtected(x: unknown): x is MeteoriteProtected {
  return (x as { meteoriteProtected?: unknown } | null)?.meteoriteProtected === true;
}
