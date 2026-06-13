import type { Vector } from "../../../io/vavr/SeqTypes.js";
import type { Tile } from "./Tile.js";

/** A group of tiles that can be (de)activated together (dragon/lake tiles, ...). */
export class TileGroup {
  constructor(
    private readonly name: string,
    private readonly tiles: Vector<Tile>,
    private readonly active: boolean,
    private readonly successiveGroup: string | null = null,
  ) {}

  getName(): string {
    return this.name;
  }

  getTiles(): Vector<Tile> {
    return this.tiles;
  }

  setTiles(tiles: Vector<Tile>): TileGroup {
    if (this.tiles === tiles) return this;
    return new TileGroup(this.name, tiles, this.active, this.successiveGroup);
  }

  mapTiles(fn: (tiles: Vector<Tile>) => Vector<Tile>): TileGroup {
    return this.setTiles(fn(this.tiles));
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): TileGroup {
    if (this.active === active) return this;
    return new TileGroup(this.name, this.tiles, active, this.successiveGroup);
  }

  getSuccessiveGroup(): string | null {
    return this.successiveGroup;
  }

  setSuccessiveGroup(successiveGroup: string | null): TileGroup {
    if (this.successiveGroup === successiveGroup) return this;
    return new TileGroup(this.name, this.tiles, this.active, successiveGroup);
  }

  size(): number {
    return this.tiles.size();
  }

  isEmpty(): boolean {
    return this.tiles.isEmpty();
  }
}
