import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import type { EdgePattern } from "../../board/EdgePattern.js";
import type { Location } from "../../board/Location.js";
import type { Position } from "../../board/Position.js";
import type { Rotation } from "../../board/Rotation.js";
import type { Tile } from "../../board/Tile.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { Feature } from "../../feature/Feature.js";

/** A tile placed on the board (a {@link Tile} at a {@link Position} with a {@link Rotation}). */
export class PlacedTile {
  constructor(
    private readonly tile: Tile,
    private readonly position: Position,
    private readonly rotation: Rotation,
  ) {}

  getTile(): Tile {
    return this.tile;
  }

  getPosition(): Position {
    return this.position;
  }

  getRotation(): Rotation {
    return this.rotation;
  }

  setTile(tile: Tile): PlacedTile {
    return new PlacedTile(tile, this.position, this.rotation);
  }

  mapTile(fn: (tile: Tile) => Tile): PlacedTile {
    return new PlacedTile(fn(this.tile), this.position, this.rotation);
  }

  setPosition(position: Position): PlacedTile {
    return new PlacedTile(this.tile, position, this.rotation);
  }

  setRotation(rotation: Rotation): PlacedTile {
    return new PlacedTile(this.tile, this.position, rotation);
  }

  getEdgePattern(): EdgePattern {
    return this.tile.getEdgePattern().rotate(this.rotation);
  }

  getInitialFeaturePartOf(loc: Location): Tuple2<FeaturePointer, Feature> | null {
    const initialLoc = loc.rotateCCW(this.rotation);
    return this.tile
      .getInitialFeatures()
      .find((t) => initialLoc.isPartOf(t._1.getLocation()!))
      .map((t) => t.map1((l) => l.rotateCW(this.rotation)))
      .getOrNull();
  }

  toString(): string {
    return `${this.tile},${this.position},${this.rotation}`;
  }
}
