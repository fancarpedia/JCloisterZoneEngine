/** Marker trait (UI hint + meteorite corner check): figure rendered translated to the tile's
 *  top-left corner (Barn, Obelisk). Duck-typed — use {@link isInstanceOfTopLeftTranslatedFigurePosition}. */
export interface TopLeftTranslatedFigurePosition {
  readonly topLeftTranslated: true;
}

export function isInstanceOfTopLeftTranslatedFigurePosition(x: unknown): x is TopLeftTranslatedFigurePosition {
  return (x as { topLeftTranslated?: unknown } | null)?.topLeftTranslated === true;
}
