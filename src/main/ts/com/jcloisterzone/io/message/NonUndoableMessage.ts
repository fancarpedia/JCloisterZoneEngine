/**
 * A message that may not be taken back.
 *
 * Normally a move is undoable while the same player stays active and no client random was
 * consumed. Some choices must stick even then - choosing which completed feature scores first
 * decides who gets a castle's points, and letting the turn player retake it after seeing the
 * result would make the choice meaningless. The Engine clears the undo history after one of these.
 */
export interface NonUndoableMessage {
  readonly nonUndoable: true;
}

/** Runtime mirror of `instanceof NonUndoableMessage` (TS interfaces are erased) - duck-typed on
 *  the marker member, the project's convention for interface guards. */
export function isInstanceOfNonUndoableMessage(m: unknown): m is NonUndoableMessage {
  return (m as { nonUndoable?: unknown } | null)?.nonUndoable === true;
}
