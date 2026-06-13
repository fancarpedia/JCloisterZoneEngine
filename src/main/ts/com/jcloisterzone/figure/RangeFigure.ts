import type { Stream } from "../../../io/vavr/SeqTypes.js";
import type { GameState } from "../game/state/GameState.js";
import type { PlacedTile } from "../game/state/PlacedTile.js";

/** A figure that affects a range of tiles (dragon, fairy, ...). */
export interface RangeFigure {
  getRangeTiles(state: GameState): Stream<PlacedTile>;
}
