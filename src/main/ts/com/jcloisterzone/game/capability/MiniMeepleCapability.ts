import type { Seq } from "../../../../io/vavr/Seq.js";
import type { Arr } from "../../../../io/vavr/SeqTypes.js";
import { MeepleAwardedEvent } from "../../event/MeepleAwardedEvent.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import type { Follower } from "../../figure/Follower.js";
import { MiniFollower } from "../../figure/MiniFollower.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";
import type { PlacedTile } from "../state/PlacedTile.js";
import { AbbeyCapability } from "./AbbeyCapability.js";

/**
 * Mini Meeple (fan expansion).
 *
 * Placing a REGULAR tile into a hole — a position whose four orthogonal neighbours are all
 * already occupied — awards the placing player one Mini Meeple (a follower of power 0.5, see
 * MiniFollower), up to a per-game cap. The abbey tile never awards one; any other tile does,
 * including one placed from a player's hand (a bazaar-won or pre-drawn tile) — those are
 * ordinary tiles, they just were not drawn this turn.
 *
 * Players start with NO Minis in their supply: the figure is created here, at the moment it
 * is awarded, and appended to the player's followers. That keeps the supply honest — what a
 * player holds is exactly what they have earned — and means an unawarded Mini cannot leak
 * into actions, the state JSON or the AI, because it does not exist yet.
 *
 * Because the award happens inside the PlaceTile reducer, it lands before ActionPhase.enter
 * builds the meeple actions — so a Mini earned by the current placement is already deployable
 * in the same turn, including onto the very tile that earned it.
 *
 * Model: the per-player cap, taken from the `mini-follower` element. How many a player has
 * already been awarded is simply how many Minis they hold, so no per-player counter is kept.
 */
export class MiniMeepleCapability extends Capability<number> {
  static readonly simpleName = "MiniMeepleCapability";

  /** Upper bound on the cap (the `mini-follower` element is an integer count). */
  static readonly MAX_MINI_MEEPLES = 9;
  /** Used when the element carries a legacy boolean `true` or anything unparseable. */
  static readonly DEFAULT_MINI_MEEPLES = 2;

  override onStartGame(state: GameState, _random: RandomGenerator): GameState {
    const raw = state.getElements().get("mini-follower").getOrNull();
    let cap = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isInteger(cap) || cap < 0) cap = MiniMeepleCapability.DEFAULT_MINI_MEEPLES;
    if (cap > MiniMeepleCapability.MAX_MINI_MEEPLES) cap = MiniMeepleCapability.MAX_MINI_MEEPLES;
    return this.setModel(state, cap);
  }

  override onTilePlaced(state: GameState, placedTile: PlacedTile): GameState {
    // The abbey is not a regular tile — placing it into a hole awards nothing.
    if (AbbeyCapability.isAbbey(placedTile.getTile())) return state;

    // A hole is a position with all four orthogonal neighbours present. state.getHoles()
    // enumerates EMPTY hole positions (that is what abbey placement needs), so it is the wrong
    // tool here: by now the tile has already landed. Counting the orthogonal neighbours that
    // exist is the post-placement equivalent — Position.ADJACENT is exactly those four.
    if (state.getAdjacentTiles2(placedTile.getPosition()).size() !== 4) return state;

    // Undefined during `start` preplacement, which runs before onStartGame. Harmless: a start
    // tile can never have four neighbours, so nothing is owed there anyway.
    const cap = this.getModel(state);
    if (cap === null || cap === undefined || cap <= 0) return state;

    const player = state.getTurnPlayer()!;
    const index = player.getIndex();
    const all = state.getPlayers().getFollowers();
    const mine = all.get(index);
    const owned = mine.filter((f) => f instanceof MiniFollower).size();
    if (owned >= cap) return state;

    // Mirrors MeepleIdProvider's "<player>.<type>.<n>" ids (0.mini.1, 0.mini.2, ...). The count
    // is derived from state, so a replay regenerates the same id every time.
    const mini = new MiniFollower(`${index}.mini.${owned + 1}`, player);
    state = state.mapPlayers((ps) =>
      ps.setFollowers(
        all.update(index, mine.append(mini) as Seq<Follower>) as Arr<Seq<Follower>>,
      ),
    );

    // History entry: which player earned which meeple, and the tile placement that earned it
    // (the client highlights that tile when the entry is hovered).
    return state.appendEvent(
      new MeepleAwardedEvent(
        PlayEventMeta.createWithPlayer(player),
        player,
        mini,
        placedTile.getPosition(),
      ),
    );
  }
}

Capability.register(MiniMeepleCapability);
