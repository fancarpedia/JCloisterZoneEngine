import { HashMap, type Map as VMap } from "../../../io/vavr/Map.js";
import { HashSet } from "../../../io/vavr/Set.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { Feature } from "../feature/Feature.js";
import type { FeatureModifier } from "../feature/modifier/FeatureModifier.js";
import { Road } from "../feature/Road.js";
import { Builder } from "../figure/Builder.js";
import { FerriesCapability } from "../game/capability/FerriesCapability.js";
import { FerriesCapabilityModel } from "../game/capability/FerriesCapabilityModel.js";
import type { GameState } from "../game/state/GameState.js";
import { PlaceFerry } from "./PlaceFerry.js";
import type { Reducer } from "./Reducer.js";
import { UndeployMeeple } from "./UndeployMeeple.js";

type ModMap = VMap<FeatureModifier<unknown>, unknown>;

/** Moves a ferry from one road-end pair to another: removes the old ferry (splitting the
 *  merged road back into its component segments), places the new one, then forces out any
 *  builder left stranded on a disconnected segment with no follower of its owner. */
export class ChangeFerry implements Reducer {
  constructor(
    private readonly from: FeaturePointer,
    private readonly to: FeaturePointer,
  ) {}

  apply(state: GameState): GameState {
    state = this.removeFerry(state);
    state = new PlaceFerry(this.to).apply(state);

    const disconnectedParts = this.from
      .getLocation()!
      .subtract(this.to.getLocation())
      .splitToSides()
      .map((loc) => new FeaturePointer(this.from.getPosition(), Road as never, loc));

    for (const fp of disconnectedParts) {
      const feature = state.getStructure(fp);
      if (feature === null) continue;
      const threatened = feature
        .getMeeples2(state)
        .filter((m) => m._1 instanceof Builder);
      for (const t of threatened) {
        if (feature.getFollowers(state).find((f) => f.getPlayer().equals(t._1.getPlayer())).isEmpty()) {
          state = new UndeployMeeple(t._1, false).apply(state);
        }
      }
    }
    return state;
  }

  private removeFerry(state: GameState): GameState {
    state = state.mapCapabilityModel<FerriesCapabilityModel>(
      FerriesCapability,
      (m) => new FerriesCapabilityModel(m.getFerries().remove(this.from), m.getMovedFerries()),
    );

    const sides = this.from
      .getLocation()!
      .splitToSides()
      .map((loc) => this.from.setLocation(loc));
    const merged = state.getFeature(sides.get(0)) as Road;

    const _state = state;
    const parts = sides.map((side) => {
      const places = merged.findSegmentBorderedBy(_state, side, () => false);
      const initialFeatures = places.map((fp) => {
        const pt = _state.getPlacedTile(fp.getPosition())!;
        const part = pt.getInitialFeaturePartOf(fp.getLocation()!)!._2;
        return (part as unknown as Road).placeOnBoard(fp.getPosition(), pt.getRotation()) as unknown as Road;
      });

      const EMPTY: ModMap = HashMap.empty<FeatureModifier<unknown>, unknown>();
      const modifiers = initialFeatures.foldLeft(EMPTY, (res, road) => road.mergeModifiers(res));

      const openTunnelEnds = merged.getOpenTunnelEnds().intersect(HashSet.ofAll(places));
      const openEdges = merged
        .getOpenEdges()
        .intersect(HashSet.ofAll(initialFeatures.flatMap((f) => f.getOpenEdges())));
      const neighbouring = merged
        .getNeighboring()
        .intersect(HashSet.ofAll(initialFeatures.flatMap((f) => f.getNeighboring())));
      const marketplaces = merged
        .getMarketplaces()
        .intersect(HashSet.ofAll(initialFeatures.flatMap((f) => f.getMarketplaces())));
      return new Road(places, openEdges, neighbouring, modifiers, openTunnelEnds, marketplaces);
    });

    // special case: ferry joined two ends of the same road; after disconnect nothing changes
    if (parts.get(0).getPlaces().size() !== merged.getPlaces().size()) {
      for (const part of parts) {
        state = state.mapFeatureMap((m) => {
          for (const fp of part.getPlaces()) {
            const pos = fp.getPosition();
            m = m.put(pos, m.get(pos).get().put(fp, part as unknown as Feature));
          }
          return m;
        });
      }
    }
    return state;
  }
}
