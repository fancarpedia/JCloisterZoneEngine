import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import type { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import { MeeplePointer } from "../../board/pointer/MeeplePointer.js";
import { ReturnMeepleAction } from "../../action/ReturnMeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { Follower } from "../../figure/Follower.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { Capability } from "../Capability.js";
import { ReturnMeepleSource } from "../ReturnMeepleSource.js";
import { Rule } from "../Rule.js";
import type { GameState } from "../state/GameState.js";

/** The Festival mini-expansion: placing a festival tile lets the turn player return one of their
 *  own meeples (only followers when {@code Rule.FESTIVAL_RETURN == "follower"}) to their supply. */
export class FestivalCapability extends Capability<void> {
  static readonly FESTIVAL = new TileModifier("Festival");
  static readonly UNDEPLOY_FESTIVAL = "festival";

  override initTile(_state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (!getElementStreamByTagName(tileElement, "festival").isEmpty()) {
      tile = tile.addTileModifier(FestivalCapability.FESTIVAL);
    }
    return tile;
  }

  override onActionPhaseEntered(state: GameState): GameState {
    const placedTile = state.getLastPlaced()!;
    if (!placedTile.getTile().hasModifier(FestivalCapability.FESTIVAL)) {
      return state;
    }

    const player = state.getTurnPlayer()!;
    const followerOnly = state.getStringRule(Rule.FESTIVAL_RETURN) === "follower";

    let options: Set<MeeplePointer> = HashSet.empty<MeeplePointer>();
    for (const t of state.getDeployedMeeples()) {
      if (!t._1.getPlayer().equals(player)) continue;
      if (followerOnly && !(t._1 instanceof Follower)) continue;
      options = options.add(new MeeplePointer(t));
    }

    if (options.isEmpty()) {
      return state;
    }

    return state.appendAction(
      new ReturnMeepleAction(options, ReturnMeepleSource.FESTIVAL) as unknown as PlayerAction<unknown>,
    );
  }
}

Capability.register(FestivalCapability);
