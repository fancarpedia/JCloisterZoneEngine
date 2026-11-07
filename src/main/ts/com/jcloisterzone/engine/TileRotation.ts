import type { Position } from "../board/Position.js";
import { Rotation } from "../board/Rotation.js";
import { TilePlacementAction } from "../action/TilePlacementAction.js";
import { Flag } from "../game/state/Flag.js";
import type { UndoHistoryItem } from "../game/UndoHistoryItem.js";
import { PlaceTileMessage } from "../io/message/PlaceTileMessage.js";
import type { Game } from "./Game.js";

/** Everything needed to turn the tile that is already on the board. */
export interface TileRotationContext {
  /** the snapshot the tile was first laid down from - the rotation is replayed from here */
  base: UndoHistoryItem;
  position: Position;
  tileId: string;
  /** the angle the tile currently lies at */
  rotation: Rotation;
  /** every angle legal at this position, in R0, R90, R180, R270 order */
  rotations: Rotation[];
}

/**
 * Whether the tile that is already on the board may still be turned, and to which angles.
 *
 * This is the single source of truth: the ROTATE_TILE handler uses it to decide and to pick the
 * next angle, and the serializer uses it to tell the client whether to offer the action. Deriving
 * both from the game rather than from anything the client remembers is what makes the option
 * survive a reload, a reconnect or a game loaded from a save - the client keeps no state of its
 * own about it.
 *
 * Null when the tile is committed as it lies (TILE_ROTATION_DISALLOWED), when the placement is no
 * longer the last move, or when the square admits only the one angle.
 */
export function tileRotationContext(game: Game): TileRotationContext | null {
  const state = game.getState();
  if (state === undefined || state === null || state.hasFlag(Flag.TILE_ROTATION_DISALLOWED)) {
    return null;
  }

  const replay = game.getReplay();
  const last = replay.isEmpty() ? null : (replay.head() as unknown as object);
  if (!(last instanceof PlaceTileMessage)) {
    return null;
  }
  const placement = last as PlaceTileMessage;
  const position = placement.getPosition();
  const rotation = placement.getRotation();
  const tileId = placement.getTileId();
  if (position === null || rotation === null || tileId === null) {
    return null;
  }

  // Walk past the snapshots that already hold this placement - those are the earlier rotations -
  // and stop at the one taken before the tile was first laid down.
  const samePlacement = (item: UndoHistoryItem): boolean => {
    const head = item.getReplay().isEmpty() ? null : (item.getReplay().head() as unknown as object);
    return head instanceof PlaceTileMessage && head.getPosition()!.equals(position);
  };
  const history = game.getUndoHistory();
  let depth = 0;
  while (depth < history.length && samePlacement(history[depth]!)) {
    depth++;
  }
  const base = history[depth];
  if (base === undefined) {
    return null;
  }

  // The legal angles are the ones the placement action offered for this square; they are known
  // only in the state the tile was placed from, which is exactly the snapshot found above.
  const action = base.getState().getAction();
  if (!(action instanceof TilePlacementAction)) {
    return null;
  }
  const rotations = action
    .getOptions()
    .toArray()
    .filter((o) => o.getPosition().equals(position))
    .map((o) => o.getRotation())
    .filter((r, i, all) => all.findIndex((x) => x.ordinal() === r.ordinal()) === i)
    .sort((a, b) => a.ordinal() - b.ordinal());
  if (rotations.length < 2) {
    return null;
  }

  return { base, position, tileId, rotation, rotations };
}

/** The angle a single press of "rotate" moves the tile to, wrapping round. */
export function nextRotation(ctx: TileRotationContext): Rotation {
  const i = ctx.rotations.findIndex((r) => r.ordinal() === ctx.rotation.ordinal());
  return ctx.rotations[(i + 1) % ctx.rotations.length]!;
}
