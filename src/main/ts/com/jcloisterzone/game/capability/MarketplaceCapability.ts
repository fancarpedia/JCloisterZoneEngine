import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import type { Position } from "../../board/Position.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { Marketplace } from "../../feature/Marketplace.js";
import type { Road } from "../../feature/Road.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";

/** Marketplace (Bridges, Castles &amp; Bazaars) scoring helper. */
export class MarketplaceCapability extends Capability<void> {
  // NOTE: appendFiguresBonusPoints is commented out in the Java source too.

  getMarketplaceOtherRoadsTiles(
    state: GameState,
    road: Road,
    marketplaceFp: FeaturePointer,
    completed: boolean,
  ): number | null {
    if (completed) {
      let tiles = 0;
      let positions: Set<Position> = HashSet.empty<Position>();
      const marketplace = state.getFeature(marketplaceFp) as Marketplace;
      const marketplaceRoads = marketplace.getMarketplaceRoads(state);
      for (const marketplaceRoad of marketplaceRoads) {
        const roadPositions = marketplaceRoad.getTilePositions();
        positions = positions.addAll(roadPositions);
        tiles += roadPositions.size();
      }
      tiles -= road.getTilePositions().size(); // exclude scored road tiles
      return tiles;
    }
    return null;
  }
}

Capability.register(MarketplaceCapability);
