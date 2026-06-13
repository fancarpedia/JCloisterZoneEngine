import { HashMap, LinkedHashMap, type Map as VMap } from "../../../io/vavr/Map.js";
import { Option } from "../../../io/vavr/Option.js";
import { Stream, Vector } from "../../../io/vavr/SeqTypes.js";
import { Tuple2 } from "../../../io/vavr/Tuple.js";
import { RandomGenerator } from "../random/RandomGenerator.js";
import type { EdgePattern } from "./EdgePattern.js";
import type { Tile } from "./Tile.js";
import { TileGroup } from "./TileGroup.js";

/** A stack of tiles to draw from; only active groups are drawable. */
export class TilePack {
  private readonly groups: LinkedHashMap<string, TileGroup>;
  private readonly hiddenUnderHills: number;

  constructor(groups: LinkedHashMap<string, TileGroup>, hiddenUnderHills: number) {
    this.groups = groups;
    this.hiddenUnderHills = hiddenUnderHills;
  }

  getGroups(): LinkedHashMap<string, TileGroup> {
    return this.groups;
  }

  getHiddenUnderHills(): number {
    return this.hiddenUnderHills;
  }

  setGroups(groups: LinkedHashMap<string, TileGroup>): TilePack {
    if (this.groups === groups) return this;
    return new TilePack(groups, this.hiddenUnderHills);
  }

  setHiddenUnderHills(hiddenUnderHills: number): TilePack {
    if (this.hiddenUnderHills === hiddenUnderHills) return this;
    return new TilePack(this.groups, hiddenUnderHills);
  }

  increaseHiddenUnderHills(): TilePack {
    return this.setHiddenUnderHills(this.hiddenUnderHills + 1);
  }

  private getActiveGroups(): Stream<TileGroup> {
    return Stream.ofAll(this.groups.values()).filter((g) => g.isActive()) as Stream<TileGroup>;
  }

  private getActiveTiles(): Stream<Tile> {
    return this.getActiveGroups().flatMap((g) => g.getTiles()) as Stream<Tile>;
  }

  getPatterns(): VMap<EdgePattern, number> {
    return Stream.ofAll(this.groups.values())
      .flatMap((g) => g.getTiles())
      .map((t) => t.getEdgePattern())
      .map((ep) => ep.canonize())
      .foldLeft(HashMap.empty<EdgePattern, number>() as VMap<EdgePattern, number>, (m, e) =>
        m.put(e, m.getOrElse(e, 0) + 1),
      );
  }

  totalSize(): number {
    return Stream.ofAll(this.groups.values()).map((g) => g.size()).sum() - this.hiddenUnderHills;
  }

  size(): number {
    return this.getActiveGroups().map((g) => g.size()).sum() - this.hiddenUnderHills;
  }

  isEmpty(): boolean {
    return this.size() <= 0;
  }

  protected getInternalSize(): number {
    return this.size() + this.hiddenUnderHills;
  }

  hasGroup(name: string): boolean {
    return this.groups.containsKey(name);
  }

  getGroup(name: string): TileGroup | null {
    return this.groups.get(name).getOrNull();
  }

  getGroupSize(name: string): number {
    return this.groups.get(name).map((g) => g.size()).getOrElse(0);
  }

  mapGroup(name: string, mapper: (g: TileGroup) => TileGroup): TilePack {
    return this.updateGroup(mapper(this.getGroup(name)!));
  }

  updateGroup(group: TileGroup): TilePack;
  updateGroup(key: string, tiles: Vector<Tile>): TilePack;
  updateGroup(a: TileGroup | string, tiles?: Vector<Tile>): TilePack {
    if (typeof a === "string") {
      const _groups = this.groups.mapValues((tileGroup) => {
        tileGroup.setTiles(tiles!);
        return tileGroup;
      });
      return new TilePack(_groups as LinkedHashMap<string, TileGroup>, this.hiddenUnderHills);
    }
    const group = a;
    if (group.isEmpty()) {
      let pack = this.setGroups(this.groups.remove(group.getName()) as LinkedHashMap<string, TileGroup>);
      const succ = group.getSuccessiveGroup();
      if (succ !== null && pack.hasGroup(succ)) {
        pack = pack.activateGroup(succ);
      }
      return pack;
    }
    return this.setGroups(this.groups.put(group.getName(), group) as LinkedHashMap<string, TileGroup>);
  }

  removeGroup(name: string): TilePack {
    return this.setGroups(this.groups.remove(name) as LinkedHashMap<string, TileGroup>);
  }

  drawTile(random: RandomGenerator): Tuple2<Tile, TilePack>;
  drawTile(groupName: string, tileId: string): Tuple2<Tile, TilePack>;
  drawTile(tileId: string): Tuple2<Tile, TilePack>;
  drawTile(a: RandomGenerator | string, tileId?: string): Tuple2<Tile, TilePack> {
    if (a instanceof RandomGenerator) {
      let index = a.getNextInt(this.getInternalSize());
      for (let group of this.getActiveGroups()) {
        if (index < group.size()) {
          const tiles = group.getTiles();
          const tile = tiles.get(index);
          group = group.setTiles(tiles.removeAt(index) as Vector<Tile>);
          return new Tuple2(tile, this.updateGroup(group));
        }
        index -= group.size();
      }
      throw new Error("IllegalArgument");
    }
    if (tileId !== undefined) {
      // (groupName, tileId)
      const matchesId = (t: Tile) => t.getId() === tileId;
      const group = this.groups.get(a).getOrElseThrow(() => new Error("IllegalArgument"));
      const tile = group.getTiles().find(matchesId).getOrElseThrow(() => new Error("IllegalArgument"));
      const pack = this.updateGroup(group.mapTiles((tiles) => tiles.removeFirst(matchesId) as Vector<Tile>));
      return new Tuple2(tile, pack);
    }
    // (tileId)
    for (const group of this.getActiveGroups()) {
      try {
        return this.drawTile(group.getName(), a);
      } catch (e) {
        // pass
      }
    }
    throw new Error("Tile pack does not contain active " + a);
  }

  removeTilesById(tileId: string): TilePack {
    return this.setGroups(
      this.groups.mapValues((g) =>
        g.mapTiles((tiles) => tiles.filter((tile) => tile.getId() !== tileId) as Vector<Tile>),
      ) as LinkedHashMap<string, TileGroup>,
    );
  }

  activateGroup(groupName: string): TilePack {
    const group = this.groups.get(groupName).getOrNull();
    if (group === null || group.isActive()) return this;
    return this.setGroups(this.groups.put(groupName, group.setActive(true)) as LinkedHashMap<string, TileGroup>);
  }

  deactivateGroup(groupName: string): TilePack {
    const group = this.groups.get(groupName).getOrNull();
    if (group === null || !group.isActive()) return this;
    return this.setGroups(this.groups.put(groupName, group.setActive(false)) as LinkedHashMap<string, TileGroup>);
  }

  getSizeForEdgePattern(edgePattern: EdgePattern): number {
    return this.getActiveTiles()
      .filter((tile) => edgePattern.isMatchingAnyRotation(tile.getEdgePattern()))
      .size();
  }

  findTile(tileId: string): Option<Tile> {
    const pred = (t: Tile) => t.getId() === tileId;
    for (const group of this.groups.values()) {
      const res = group.getTiles().find(pred);
      if (!res.isEmpty()) return res;
    }
    return Option.none<Tile>();
  }

  toString(): string {
    return `${this.size()}/${this.totalSize()}`;
  }
}
