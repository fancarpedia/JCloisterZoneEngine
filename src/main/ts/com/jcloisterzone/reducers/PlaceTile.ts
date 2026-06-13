import { HashMap, type Map as VMap } from "../../../io/vavr/Map.js";
import { HashSet, type Set } from "../../../io/vavr/Set.js";
import { LinkedHashMap } from "../../../io/vavr/Map.js";
import { Stream } from "../../../io/vavr/SeqTypes.js";
import { Tuple2, Tuple3 } from "../../../io/vavr/Tuple.js";
import type { ClassToken } from "../../../lang/Class.js";
import { Edge } from "../board/Edge.js";
import type { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { ShortEdge } from "../board/ShortEdge.js";
import type { Tile } from "../board/Tile.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import { PlayEventMeta } from "../event/PlayEvent.js";
import { TilePlacedEvent } from "../event/TilePlacedEvent.js";
import { City } from "../feature/City.js";
import { type EdgeFeature, isInstanceOfEdgeFeature } from "../feature/EdgeFeature.js";
import type { Feature } from "../feature/Feature.js";
import type { MultiTileFeature } from "../feature/MultiTileFeature.js";
import { type NeighbouringFeature, isInstanceOfNeighbouringFeature } from "../feature/NeighbouringFeature.js";
import { Road } from "../feature/Road.js";
import { TunnelCapability } from "../game/capability/TunnelCapability.js";
import type { GameState } from "../game/state/GameState.js";
import { PlacedTile } from "../game/state/PlacedTile.js";
import type { PlacedTunnelToken } from "../game/state/PlacedTunnelToken.js";
import type { Reducer } from "./Reducer.js";

// erased-interface runtime checks (TS interfaces don't support instanceof)

/** Places a tile and merges/closes its features against the board. */
export class PlaceTile implements Reducer {
  // whole-placement scratch
  private _state!: GameState;
  private fpUpdate: VMap<FeaturePointer, Feature> = HashMap.empty();
  private newTunnels: Set<FeaturePointer> = HashSet.empty();
  private multiEdgePairsToMerge: Tuple3<FeaturePointer, FeaturePointer, ShortEdge>[] = [];
  private edgesToClose: Tuple3<Edge, FeaturePointer, FeaturePointer>[] = [];
  // per-feature-merge scratch
  private alreadyMerged: globalThis.Set<Feature> = new globalThis.Set();
  private mergedEdges: Set<Edge> = HashSet.empty();

  constructor(
    private readonly tile: Tile,
    private readonly pos: Position,
    private readonly rot: Rotation,
  ) {}

  private findMultiEdges(city: City): void {
    city
      .getMultiEdges()
      .filter((e) => this.mergedEdges.contains(e._1.toEdge()))
      .forEach((multiEdge) => {
        const adjFp = multiEdge._2;
        const cityFp = city.getPlaces().find((fp) => fp.getPosition().equals(this.pos)).get();
        this.multiEdgePairsToMerge.push(new Tuple3(adjFp, cityFp, multiEdge._1));
      });
  }

  private closeEdge(
    edge: Edge,
    f: EdgeFeature,
    fp: FeaturePointer,
    adj: EdgeFeature | null,
    adjFp: FeaturePointer,
  ): EdgeFeature {
    f = f.closeEdge(edge);
    let neiTarget: Feature | null = adj as unknown as Feature | null;
    let neiFp = adjFp;
    if (adj !== null && adj.getProxyTarget() !== null) {
      neiFp = adj.getProxyTarget()!;
      neiTarget = this.getFeature(neiFp);
    }
    if (isInstanceOfNeighbouringFeature(f as unknown as Feature) && neiTarget !== null && isInstanceOfNeighbouringFeature(neiTarget)) {
      const _f = f as unknown as NeighbouringFeature;
      f = _f.setNeighboring(_f.getNeighboring().add(neiFp)) as unknown as EdgeFeature;
    }
    if (f instanceof City) {
      const shortEdge = new ShortEdge(edge);
      const city = f as City;
      const multiEdgeFp = city
        .getMultiEdges()
        .find((me) => me._1.equals(shortEdge))
        .map((t) => t._2)
        .getOrNull();
      if (multiEdgeFp !== null) {
        const sameCity = city.getPlaces().contains(multiEdgeFp);
        if (sameCity) {
          f = city.setOpenEdges(city.getOpenEdges().remove(shortEdge));
        } else {
          let city2 = this.getFeature(multiEdgeFp) as City;
          city2 = city2.setOpenEdges(city2.getOpenEdges().remove(shortEdge));
          if (adj !== null && isInstanceOfNeighbouringFeature(adj as unknown as Feature)) {
            city2 = city2.setNeighboring(city2.getNeighboring().add(adjFp));
          }
          this.updateRefs(city2);
        }
      }
    }
    return f;
  }

  apply(state: GameState): GameState {
    const placedTiles = state.getPlacedTiles();
    const placedTile = new PlacedTile(this.tile, this.pos, this.rot);
    state = state.setPlacedTiles(placedTiles.put(this.pos, placedTile) as LinkedHashMap<Position, PlacedTile>);

    this._state = state;
    this.fpUpdate = HashMap.empty<FeaturePointer, Feature>();
    this.newTunnels = HashSet.empty<FeaturePointer>();
    this.multiEdgePairsToMerge = [];
    this.edgesToClose = [];

    Stream.ofAll(this.tile.getInitialFeatures().values())
      .map((f) => f.placeOnBoard(this.pos, this.rot))
      .forEach((feature0) => {
        let feature = feature0;
        if (feature instanceof Road) {
          this.newTunnels = this.newTunnels.addAll(feature.getOpenTunnelEnds());
        }

        if (isInstanceOfEdgeFeature(feature)) {
          this.alreadyMerged = new globalThis.Set<Feature>();
          this.mergedEdges = HashSet.empty<Edge>();

          const adjacent = feature.getPlaces().head().getAdjacent();
          let f: EdgeFeature = feature as unknown as EdgeFeature;
          f = adjacent.foldLeft(f, (acc, adjFp0) => {
            let af = adjFp0;
            if (this._state.getPlacedTile(af.getPosition()) === null) {
              return acc;
            }
            const adjTuple = this._state.getFeaturePartOf2(af.getPosition(), af.getLocation()!);
            let adj: EdgeFeature | null = adjTuple === null ? null : (adjTuple._2 as unknown as EdgeFeature);
            if (adj !== null && acc.isMergeableWith(adj)) {
              if (!this.alreadyMerged.has(adj as unknown as Feature)) {
                this.alreadyMerged.add(adj as unknown as Feature);
                acc = (acc as unknown as MultiTileFeature).merge(
                  this.getRecent(adj as unknown as Feature) as unknown as MultiTileFeature,
                ) as unknown as EdgeFeature;
              }
              if (acc instanceof City) {
                this.mergedEdges = this.mergedEdges.add(new Edge(this.pos, af.getPosition()));
              }
            } else {
              const edge = new Edge(this.pos, af.getPosition());
              const _fp = new FeaturePointer(
                af.getPosition().add(af.getLocation()!),
                (acc as object).constructor as ClassToken,
                af.getLocation()!.rev(),
              );
              const fp = (acc as unknown as Feature).getPlaces().find((p) => _fp.isPartOf(p)).get();
              if (adj !== null) {
                adj = this.getRecent(adj as unknown as Feature) as unknown as EdgeFeature;
                const _adjFp = af.setFeature((adj as object).constructor as ClassToken);
                af = (adj as unknown as Feature).getPlaces().find((p) => _adjFp.isPartOf(p)).get();
              }
              acc = this.closeEdge(edge, acc, fp, adj, af);
              if (adj !== null) {
                this.edgesToClose.push(new Tuple3(edge, af, fp));
              }
            }
            return acc;
          });
          feature = f as unknown as Feature;

          if (feature instanceof City) {
            this.findMultiEdges(feature);
          }
        }

        this.updateRefs(feature);
      });

    for (const t of this.edgesToClose) {
      let f1 = this.getFeature(t._2) as unknown as EdgeFeature;
      const f2 = this.getFeature(t._3) as unknown as EdgeFeature;
      f1 = this.closeEdge(t._1, f1, t._2, f2, t._3);
      this.updateRefs(f1 as unknown as Feature);
    }

    for (const t of this.multiEdgePairsToMerge) {
      const c1 = this.getFeature(t._1) as City;
      const c2 = this.getFeature(t._2) as City;
      let c = c1 === c2 ? c1 : c1.merge(c2);
      c = c.setOpenEdges(c.getOpenEdges().remove(t._3));
      this.updateRefs(c);
    }

    if (!this.newTunnels.isEmpty()) {
      state = state.mapCapabilityModel(
        TunnelCapability,
        (model: VMap<FeaturePointer, PlacedTunnelToken>) => {
          let newTunnelsMap: VMap<FeaturePointer, PlacedTunnelToken> = HashMap.empty();
          for (const fp of this.newTunnels) {
            newTunnelsMap = newTunnelsMap.put(fp, null as unknown as PlacedTunnelToken);
          }
          return model.merge(newTunnelsMap);
        },
      );
    }

    state = state.updateFeatureMap(this.fpUpdate);
    state = state.appendEvent(
      new TilePlacedEvent(PlayEventMeta.createWithActivePlayer(state), this.tile, this.pos, this.rot),
    );
    for (const cap of state.getCapabilities().toSeq()) {
      state = cap.onTilePlaced(state, placedTile);
    }
    return state;
  }

  private getFeature(fp: FeaturePointer): Feature | null {
    const f = this.fpUpdate.get(fp).getOrNull();
    return f === null ? this._state.getFeature(fp) : f;
  }

  private getRecent(f: Feature): Feature {
    const updated = this.fpUpdate.get(f.getPlaces().head()).getOrNull();
    return updated === null ? f : updated;
  }

  private updateRefs(f: Feature): void {
    for (const fp of f.getPlaces()) {
      this.fpUpdate = this.fpUpdate.put(fp, f);
    }
  }
}
