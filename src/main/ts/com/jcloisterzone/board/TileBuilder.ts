import { HashMap, type Map as VMap } from "../../../io/vavr/Map.js";
import { HashSet, type Set } from "../../../io/vavr/Set.js";
import { List, Stream } from "../../../io/vavr/SeqTypes.js";
import { Tuple2, Tuple3 } from "../../../io/vavr/Tuple.js";
import type { ClassToken } from "../../../lang/Class.js";
import {
  attrAsLocation,
  attrAsLocations,
  attributeBoolValue,
  contentAsLocations,
  type XmlElement,
} from "../XmlUtils.js";
import { Acrobats } from "../feature/Acrobats.js";
import { Circus } from "../feature/Circus.js";
import { YagaHut } from "../feature/YagaHut.js";
import { FishHut } from "../feature/FishHut.js";
import { Bush } from "../feature/Bush.js";
import { City } from "../feature/City.js";
import { CityGate } from "../feature/CityGate.js";
import type { Feature } from "../feature/Feature.js";
import { Field } from "../feature/Field.js";
import { GamblersLuckShield } from "../feature/GamblersLuckShield.js";
import { Marketplace } from "../feature/Marketplace.js";
import { Monastery } from "../feature/Monastery.js";
import { type NeighbouringFeature, isInstanceOfNeighbouringFeature } from "../feature/NeighbouringFeature.js";
import { River } from "../feature/River.js";
import { Road } from "../feature/Road.js";
import { Tower } from "../feature/Tower.js";
import type { FeatureModifier } from "../feature/modifier/FeatureModifier.js";
import type { Capability } from "../game/Capability.js";
import type { GameState } from "../game/state/GameState.js";
import { Edge } from "./Edge.js";
import { Location } from "./Location.js";
import { Position } from "./Position.js";
import { ShortEdge } from "./ShortEdge.js";
import { Tile } from "./Tile.js";
import { TileModifier } from "./TileModifier.js";
import { WatchtowerModifier } from "../game/capability/WatchtowerCapability.js";
import type { FeaturePointer } from "./pointer/FeaturePointer.js";
import { FeaturePointer as FP } from "./pointer/FeaturePointer.js";

type ModMap = VMap<FeatureModifier<unknown>, unknown>;
type AnyMod = FeatureModifier<unknown>;


/** Builds {@link Tile}s and their initial features from XML (port of TileBuilder). */
export class TileBuilder {
  private static readonly MONASTERY_MODIFIERS: AnyMod[] = [
    Monastery.SPECIAL_MONASTERY,
    Monastery.SHRINE,
    Monastery.CHURCH,
  ];
  private static readonly CITY_MODIFIERS: AnyMod[] = [
    City.PENNANTS,
    City.CATHEDRAL,
    City.PRINCESS,
    City.BESIEGED,
    City.DARMSTADTIUM,
    City.POINTS_MODIFIER,
    City.GAMBLERS_LUCK_SHIELDS as unknown as AnyMod,
  ];
  private static readonly ROAD_MODIFIERS: AnyMod[] = [Road.INN, Road.LABYRINTH, Road.ROBBERS_SON, Road.WELL];
  private static readonly FIELD_MODIFIERS: AnyMod[] = [Field.FLOWERS as unknown as AnyMod];
  private static readonly RIVER_MODIFIERS: AnyMod[] = [];

  private externalModifiers: AnyMod[] = [];
  private modifiersByType: Map<string, AnyMod[]> = new Map();

  private features: VMap<FeaturePointer, Feature> = HashMap.empty();
  private multiEdges: Tuple3<ShortEdge, Location, FeaturePointer>[] = [];
  private neighbouring: Map<string, FeaturePointer[]> = new Map();
  private marketplaces: Map<string, FeaturePointer[]> = new Map();
  private tileId: string | null = null;

  private state!: GameState;

  getGameState(): GameState {
    return this.state;
  }

  setGameState(state: GameState): void {
    this.state = state;
  }

  setExternalModifiers(externalModifiers: AnyMod[]): void {
    this.externalModifiers = externalModifiers;
    this.modifiersByType = new Map();
    this.modifiersByType.set("road", [...TileBuilder.ROAD_MODIFIERS]);
    this.modifiersByType.set("city", [...TileBuilder.CITY_MODIFIERS]);
    this.modifiersByType.set("monastery", [...TileBuilder.MONASTERY_MODIFIERS]);
    this.modifiersByType.set("field", [...TileBuilder.FIELD_MODIFIERS]);
    this.modifiersByType.set("river", [...TileBuilder.RIVER_MODIFIERS]);
    for (const mod of externalModifiers) {
      const key = mod.getSelector().split("[")[0];
      let list = this.modifiersByType.get(key);
      if (!list) {
        list = [];
        this.modifiersByType.set(key, list);
      }
      list.push(mod);
    }
  }

  getExternalModifiers(): AnyMod[] {
    return this.externalModifiers;
  }

  createTile(tileId: string, tileElement: XmlElement, isTunnelActive: boolean): Tile {
    this.features = HashMap.empty<FeaturePointer, Feature>();
    this.multiEdges = [];
    this.neighbouring = new Map();
    this.marketplaces = new Map();
    let tileModifiers: Set<TileModifier> = HashSet.empty<TileModifier>();
    this.tileId = tileId;

    const nl = tileElement.childNodes;
    for (let i = 0; i < nl.length; i++) {
      const node = nl.item(i);
      if (node === null || node.nodeType !== 1) continue;
      const el = node as XmlElement;
      switch (el.nodeName) {
        case "monastery":
          this.processMonasteryElement(el);
          break;
        case "road":
          this.processRoadElement(el, isTunnelActive);
          break;
        case "city":
          this.processCityElement(el);
          break;
        case "field":
          this.processFieldElement(el);
          break;
        case "river":
          this.processRiverElement(el);
          break;
        case "tower":
          this.initFeature(el, new Tower());
          break;
        case "acrobats":
          this.initFeature(el, new Acrobats());
          break;
        case "circus":
          this.initFeature(el, new Circus());
          break;
        case "marketplace":
          this.initFeature(el, new Marketplace());
          break;
        case "gamblersluckshield":
          this.initFeature(el, new GamblersLuckShield(contentAsLocations(el).head()));
          break;
        case "yaga-hut":
          this.initFeature(el, new YagaHut());
          break;
        case "watchtower":
          tileModifiers = tileModifiers.add(new WatchtowerModifier(el.getAttribute("bonus")));
          break;
        case "fishhut":
          this.initFeature(el, new FishHut(contentAsLocations(el).head()));
          break;
      }
    }

    for (const multiEdge of this.multiEdges) {
      let matched: Tuple2<FeaturePointer, Feature> | null = null;
      for (const entry of this.features) {
        if (multiEdge._2.isPartOf(entry._1.getLocation()!)) {
          matched = entry;
          break;
        }
      }
      if (matched === null) throw new Error("Matching city not found");
      let target = matched._2 as City;
      let targetMultiEdges = target.getMultiEdges();
      targetMultiEdges = targetMultiEdges.add(new Tuple2(multiEdge._1, multiEdge._3));
      target = target.setMultiEdges(targetMultiEdges);
      this.features = this.features.put(matched._1, target);
    }

    for (const _fps of this.neighbouring.values()) {
      const fps = List.ofAll(_fps);
      for (const fp of fps) {
        let feature = this.features.get(fp).get() as unknown as NeighbouringFeature;
        feature = feature.setNeighboring(feature.getNeighboring().addAll(fps.remove(fp)));
        this.features = this.features.put(fp, feature as unknown as Feature);
      }
    }

    for (const _fps of this.marketplaces.values()) {
      const fps = List.ofAll(_fps);
      for (const fp of fps) {
        if (fp.getFeature() === Road) {
          let feature = this.features.get(fp).get() as Road;
          feature = feature.setMarketplaces(feature.getMarketplaces().addAll(fps.remove(fp)));
          this.features = this.features.put(fp, feature);
        } else if (fp.getFeature() === Marketplace) {
          let feature = this.features.get(fp).get() as Marketplace;
          feature = feature.setAdjoiningRoads(feature.getAdjoiningRoads().addAll(fps.remove(fp)));
          this.features = this.features.put(fp, feature);
        }
      }
    }

    const tileDef = new Tile(tileId, this.features, tileModifiers);
    this.features = HashMap.empty();
    this.tileId = null;
    return tileDef;
  }

  initFeature(xml: XmlElement | null, feature: Feature): void {
    if (feature instanceof Field && this.tileId!.startsWith("CO/")) {
      feature = feature.setAdjoiningCityOfCarcassonne(true);
    }
    for (const cap of this.state.getCapabilities().toSeq()) {
      feature = (cap as Capability<unknown>).initFeature(this.state, this.tileId!, feature, xml as XmlElement);
    }

    const fp = feature.getPlaces().head();
    this.features = this.features.put(fp, feature);

    if (isInstanceOfNeighbouringFeature(feature) && xml !== null) {
      for (const wagonMove of xml.getAttribute("wagon-move").split(/\s/)) {
        if (wagonMove.length > 0) {
          let connected = this.neighbouring.get(wagonMove);
          if (!connected) {
            connected = [];
            this.neighbouring.set(wagonMove, connected);
          }
          connected.push(fp);
        }
      }
    }
    if ((feature instanceof Road || feature instanceof Marketplace) && xml !== null) {
      for (const conn of xml.getAttribute("marketplace").split(/\s/)) {
        if (conn.length > 0) {
          let connected = this.marketplaces.get(conn);
          if (!connected) {
            connected = [];
            this.marketplaces.set(conn, connected);
          }
          connected.push(fp);
        }
      }
    }
  }

  private getFeatureModifiers(featureType: string, el: XmlElement): ModMap {
    let modifiers: ModMap = HashMap.empty<AnyMod, unknown>();
    const declared = this.modifiersByType.get(featureType);
    if (declared) {
      for (const mod of declared) {
        if (el.hasAttribute(mod.getName())) {
          modifiers = modifiers.put(mod, mod.valueOf(el.getAttribute(mod.getName())));
        }
      }
    }
    return modifiers;
  }

  private processMonasteryElement(e: XmlElement): void {
    const modifiers = this.getFeatureModifiers("monastery", e);
    this.initFeature(e, new Monastery(modifiers));
  }

  private processRoadElement(e: XmlElement, isTunnelActive: boolean): void {
    const sides = contentAsLocations(e).flatMap((loc) =>
      loc.isInner() ? List.of(loc) : loc.splitToSides(),
    ) as Stream<Location>;
    if (sides.size() > 1 && isTunnelActive && attributeBoolValue(e, "tunnel")) {
      sides.forEach((loc) => this.processRoadElementSides(Stream.of(loc), e, true));
    } else {
      this.processRoadElementSides(sides, e, isTunnelActive);
    }
  }

  private processRoadElementSides(sides: Stream<Location>, e: XmlElement, isTunnelActive: boolean): void {
    const fp = this.initFeaturePointer(sides, Road);
    const modifiers = this.getFeatureModifiers("road", e);
    let road = new Road(List.of(fp), TileBuilder.initOpenEdges(sides), modifiers);
    if (isTunnelActive && attributeBoolValue(e, "tunnel")) {
      road = road.setOpenTunnelEnds(HashSet.of(fp));
    }
    this.initFeature(e, road);
    if (e.hasAttribute("bush")) {
      attrAsLocations(e, "bush").forEach((loc) => {
        const bushFp = new FP(Position.ZERO, Bush, loc);
        this.initFeature(null, new Bush(List.of(bushFp), fp));
      });
    }
  }

  private processCityElement(e: XmlElement): void {
    const sides = contentAsLocations(e).flatMap((loc) =>
      loc.isInner() ? List.of(loc) : loc.splitToSides(),
    ) as Stream<Location>;
    const fp = this.initFeaturePointer(sides, City);
    let openEdges = TileBuilder.initOpenEdges(sides);

    if (e.hasAttribute("multi-edge")) {
      const multiEdgeLoc = attrAsLocation(e, "multi-edge");
      if (!multiEdgeLoc.isEdge()) throw new Error("Multi edge must be side location");
      const multiEdge = new ShortEdge(Position.ZERO, multiEdgeLoc);
      this.multiEdges.push(new Tuple3(multiEdge, multiEdgeLoc, fp));
      openEdges = openEdges.add(multiEdge);
    }

    const modifiers = this.getFeatureModifiers("city", e);
    this.initFeature(e, new City(List.of(fp), openEdges, modifiers));

    if (e.hasAttribute("city-gate")) {
      attrAsLocations(e, "city-gate").forEach((loc) => {
        const gateFp = new FP(Position.ZERO, CityGate, loc);
        this.initFeature(null, new CityGate(List.of(gateFp), fp));
      });
    }
  }

  private processRiverElement(e: XmlElement): void {
    const sides = contentAsLocations(e).flatMap((loc) =>
      loc.isInner() ? List.of(loc) : loc.splitToSides(),
    ) as Stream<Location>;
    const fp = this.initFeaturePointer(sides, River);
    const openEdges = TileBuilder.initOpenEdges(sides);
    const modifiers = this.getFeatureModifiers("river", e);
    this.initFeature(e, new River(List.of(fp), openEdges, modifiers));
  }

  private processFieldElement(e: XmlElement): void {
    const sides = contentAsLocations(e);
    const fp = this.initFeaturePointer(sides, Field);
    let adjoiningCities: Set<FeaturePointer>;

    if (e.hasAttribute("city")) {
      const citiesLocs = attrAsLocations(e, "city").map((partial) => {
        for (const entry of this.features) {
          if (entry._2 instanceof City) {
            const loc = entry._1.getLocation()!;
            if (partial.equals(loc) || partial.isPartOf(loc)) {
              return loc;
            }
          }
        }
        throw new Error(`Unable to match adjoining city ${partial} for tile ${this.tileId}`);
      });
      adjoiningCities = HashSet.ofAll(
        citiesLocs.map((loc) => new FP(Position.ZERO, City, loc)).toArray(),
      );
    } else {
      adjoiningCities = HashSet.empty<FeaturePointer>();
    }

    const modifiers = this.getFeatureModifiers("field", e);
    this.initFeature(e, new Field(List.of(fp), adjoiningCities, false, modifiers));
  }

  private initFeaturePointer(sides: Stream<Location>, clazz: ClassToken): FeaturePointer {
    let loc: Location | null = null;
    sides.forEach((l) => {
      loc = loc === null ? l : (loc as Location).union(l);
    });
    return new FP(Position.ZERO, clazz, loc!);
  }

  /** Open edges for the given sides (edges anchored at Position.ZERO). */
  static initOpenEdges(sides: Stream<Location>): Set<Edge> {
    return HashSet.ofAll(
      sides.filter((loc) => loc.isEdge()).map((loc) => new Edge(Position.ZERO, loc)),
    );
  }
}
