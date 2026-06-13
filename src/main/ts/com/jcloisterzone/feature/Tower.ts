import { List } from "../../../io/vavr/SeqTypes.js";
import { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import type { Rotation } from "../board/Rotation.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { TowerCapability } from "../game/capability/TowerCapability.js";
import type { Feature } from "./Feature.js";
import type { Structure } from "./Structure.js";
import { TileFeature } from "./TileFeature.js";

type TowerToken = TowerCapability.TowerToken;

/** A tower (The Tower expansion). Holds stacked tower pieces. */
export class Tower extends TileFeature implements Structure {
  static readonly simpleName = "Tower";

  private static readonly INITIAL_PLACE = List.of(
    new FeaturePointer(Position.ZERO, Tower, Location.I),
  );

  private readonly pieces: List<TowerToken>;

  constructor(places: List<FeaturePointer> = Tower.INITIAL_PLACE, pieces: List<TowerToken> = List.empty<TowerToken>()) {
    super(places);
    this.pieces = pieces;
  }

  placeOnBoard(pos: Position, rot: Rotation): Feature {
    return new Tower(this.placeOnBoardPlaces(pos, rot), this.pieces);
  }

  addPiece(token: TowerToken): Tower {
    return new Tower(this.places, this.pieces.append(token) as List<TowerToken>);
  }

  getPieces(): List<TowerToken> {
    return this.pieces;
  }

  matchLastPiece(token: TowerToken): boolean {
    if (this.pieces.size() === 0) {
      return false;
    }
    return this.pieces.lastOption().get() === token;
  }
}
