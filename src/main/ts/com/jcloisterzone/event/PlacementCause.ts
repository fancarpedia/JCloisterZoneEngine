import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import type { Position } from "../board/Position.js";
import type { Meeple } from "../figure/Meeple.js";

/**
 * Why a figure or piece was placed, moved or removed when no player chose it directly: the
 * automatic consequence of something else. Shared by the place/move/return events of meeples,
 * neutral figures and tokens (MeepleDeployed, MeepleReturned, NeutralFigureMoved,
 * TokenPlacedEvent, TokenRemovedEvent), so the UI can show what triggered it — e.g. the courier
 * placed on the letter symbol because that tile was placed, or walking to a freshly deployed
 * meeple. Absent (null) when the triggering player's own choice is the cause. TS-only.
 */
export type PlacementCause =
  /** a tile was placed: courier letter, volcano, circus, mandatory bridge, gold mine… */
  | { readonly type: "tile-placed"; readonly position: Position }
  /** a meeple was deployed: the courier walks to it, the Count follows it… */
  | { readonly type: "meeple-deployed"; readonly pointer: BoardPointer; readonly meeple: Meeple }
  /** another figure moved: the dragon eats a meeple, the big top leaves an animal token… */
  | { readonly type: "figure-moved"; readonly figureId: string; readonly pointer: BoardPointer | null }
  /** a named game rule: "count-clockwise", "meteorite", "wolf", "trap", "game-start", … */
  | { readonly type: "rule"; readonly name: string };

export const PlacementCause = {
  tilePlaced: (position: Position): PlacementCause => ({ type: "tile-placed", position }),
  meepleDeployed: (pointer: BoardPointer, meeple: Meeple): PlacementCause => ({
    type: "meeple-deployed",
    pointer,
    meeple,
  }),
  figureMoved: (figureId: string, pointer: BoardPointer | null): PlacementCause => ({
    type: "figure-moved",
    figureId,
    pointer,
  }),
  rule: (name: string): PlacementCause => ({ type: "rule", name }),
};
