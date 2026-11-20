import { List } from "../../../../io/vavr/SeqTypes.js";
import { JavaEnum } from "../../../../lang/JavaEnum.js";
import { Location } from "../../board/Location.js";
import type { PlacementOption } from "../../board/PlacementOption.js";
import type { Position } from "../../board/Position.js";
import type { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import type { XmlElement } from "../../XmlUtils.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { ScoreKingdomPointer } from "../../board/pointer/ScoreKingdomPointer.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { Castle } from "../../feature/Castle.js";
import { City } from "../../feature/City.js";
import type { Feature } from "../../feature/Feature.js";
import { Field } from "../../feature/Field.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import { Capability } from "../Capability.js";
import type { Token } from "../Token.js";
import type { GameState } from "../state/GameState.js";
import type { PlacedTile } from "../state/PlacedTile.js";

/** Marks a Kingdom Palace tile and the player colour it belongs to — read from the tile's XML
 *  attribute `kingdom-palace="<colour>"` (like `wind-rose="NWSE"`), so any add-on can define palace
 *  tiles under any id without engine changes. */
export class KingdomPalaceModifier extends TileModifier {
  constructor(private readonly color: string) {
    super("KingdomPalace:" + color);
  }
  getColor(): string {
    return this.color;
  }
}

/** A placed Kingdom Palace: where, and whose. */
export interface PlacedKingdomPalace {
  readonly position: Position;
  readonly owner: number;
}

/** Kingdoms state: each player's palace tile (their colour) and the palaces on the board. */
export class KingdomPalaceModel {
  constructor(
    /** by player index; null when the colour's tile is not defined in the loaded XML */
    readonly tiles: readonly (Tile | null)[],
    readonly palaces: readonly PlacedKingdomPalace[],
  ) {}

  getTile(playerIndex: number): Tile | null {
    return this.tiles[playerIndex] ?? null;
  }

  addPalace(palace: PlacedKingdomPalace): KingdomPalaceModel {
    return new KingdomPalaceModel(this.tiles, [...this.palaces, palace]);
  }
}

/**
 * Kingdoms (fan expansion by Luke Tubbs (Astargoth) and Giles Smith).
 *
 * Each player has Kingdom Palace tile(s) of their own colour in supply (the `kingdom-palace` element
 * is the count). Instead of drawing, a player may place one — only joining a city that holds
 * one of their followers and no palace yet (capitals may merge later through ordinary tiles). The palace is just part of that city (like Darmstadtium); the city
 * becomes a capital; a COMPLETED capital is a kingdom. At the end every kingdom scores, per player
 * owning a palace in it, 3 points for every city touching a field that touches the capital
 * (only COMPLETED cities — the capital itself, castles and the City of Carcassonne each count as
 * one city). An unfinished capital scores no kingdom. Farmers are not required.
 */
export class KingdomPalaceCapability extends Capability<KingdomPalaceModel> {
  /** Max palace tiles a player may start with. */
  static readonly MAX_TILES = 9;
  static readonly POINTS_PER_CITY = 3;

  /** Slot (= the client's player colour, see player-colors.scss) → the colour a palace tile names
   *  in its `kingdom-palace` attribute. */
  static readonly SLOT_COLORS: readonly string[] = [
    "red", "blue", "yellow", "green", "orange", "purple", "pink", "white", "black",
    // no client slot uses these yet
    "gray", "beige", "brown",
  ];

  static getPalaceColor(tile: Tile): string | null {
    return tile
      .getTileModifiers()
      .find((m) => m instanceof KingdomPalaceModifier)
      .map((m) => (m as KingdomPalaceModifier).getColor())
      .getOrNull();
  }

  static isKingdomPalace(tile: Tile): boolean {
    return KingdomPalaceCapability.getPalaceColor(tile) !== null;
  }

  /** `kingdom-palace="<colour>"` on a tile makes it a Kingdom Palace of that player colour. */
  override initTile(state: GameState, tile: Tile, el: XmlElement): Tile {
    if (el.hasAttribute("kingdom-palace")) {
      const color = el.getAttribute("kingdom-palace").trim().toLowerCase();
      if (color !== "") tile = tile.addTileModifier(new KingdomPalaceModifier(color));
    }
    return tile;
  }

  /** The palaces come from the supply tile-set (`<tile-set supply="true" element="kingdom-palace">`);
   *  each player gets the one whose colour is their slot's colour. */
  override initSupplyTiles(
    state: GameState,
    tiles: ReadonlyMap<string, Tile>,
    playerSlots: readonly number[],
  ): GameState {
    const byColor = new Map<string, Tile>();
    for (const tile of tiles.values()) {
      const color = KingdomPalaceCapability.getPalaceColor(tile);
      if (color !== null && !byColor.has(color)) byColor.set(color, tile);
    }
    const own = playerSlots.map((slot) => {
      const color = KingdomPalaceCapability.SLOT_COLORS[slot] ?? KingdomPalaceCapability.SLOT_COLORS[0]!;
      return byColor.get(color) ?? null;
    });
    return this.setModel(state, new KingdomPalaceModel(own, []));
  }

  override onStartGame(state: GameState): GameState {
    // the `kingdom-palace` element is the count of palaces per player; a boolean `true` = 1
    const raw = state.getElements().get("kingdom-palace").getOrNull();
    let count = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isInteger(count) || count < 1) count = 1;
    if (count > KingdomPalaceCapability.MAX_TILES) count = KingdomPalaceCapability.MAX_TILES;
    const model = this.getModel(state);
    // a player whose colour has no palace tile (XML not loaded) gets none
    return state.mapPlayers((ps) => {
      for (let i = 0; i < ps.getPlayers().size(); i++) {
        ps = ps.setTokenCount(i, KingdomPalaceCapability.KingdomPalaceToken.KINGDOM_PALACE, model?.getTile(i) ? count : 0);
      }
      return ps;
    });
  }

  /** The turn player's palace tile, when they still hold one. */
  static getAvailableTile(state: GameState): Tile | null {
    const player = state.getTurnPlayer();
    if (player === null) return null;
    const idx = player.getIndex();
    const tokens = state.getPlayers().getPlayerTokenCount(idx, KingdomPalaceCapability.KingdomPalaceToken.KINGDOM_PALACE);
    if (tokens <= 0) return null;
    const model = state.getCapabilityModel<KingdomPalaceModel>(KingdomPalaceCapability as never);
    return model?.getTile(idx) ?? null;
  }

  /** Only joining a city occupied by the active player's follower, and never a city that already
   *  holds a palace (anyone's) — two capitals may still be joined later by ordinary tiles. The
   *  normal edge rules apply too. */
  override isTilePlacementAllowed(state: GameState, tile: Tile, placement: PlacementOption): boolean {
    if (!KingdomPalaceCapability.isKingdomPalace(tile)) return true;
    const player = state.getTurnPlayer();
    if (player === null) return false;
    const pos = placement.getPosition();
    let ownFollower = false;
    for (const side of Location.SIDES) {
      const adj = pos.add(side);
      if (state.getPlacedTile(adj) === null) continue;
      const f = state.getFeaturePartOf(adj, side.rev());
      if (!(f instanceof City)) continue;
      // the palace would join this city — not allowed when it is already a capital
      if (f.hasModifier(state, City.KINGDOM_PALACE)) return false;
      if (f.isOccupiedBy(state, player)) ownFollower = true;
    }
    return ownFollower;
  }

  override onTilePlaced(state: GameState, placedTile: PlacedTile): GameState {
    if (!KingdomPalaceCapability.isKingdomPalace(placedTile.getTile())) return state;
    const owner = state.getTurnPlayer()!.getIndex();
    return this.updateModel(state, (m) => m.addPalace({ position: placedTile.getPosition(), owner }));
  }

  override onFinalScoring(state: GameState): GameState {
    const model = this.getModel(state);
    if (!model || model.palaces.length === 0) return state;

    const keys = new Map<Feature, string>();
    const keyOf = (f: Feature): string => {
      let k = keys.get(f);
      if (k === undefined) {
        k = f
          .getPlaces()
          .toArray()
          .map((fp) => fp.toString())
          .sort()
          .join("|");
        keys.set(f, k);
      }
      return k;
    };

    // one kingdom per (capital city, owner) — extra palaces of the same player in that city add nothing
    const kingdoms = new Map<string, { capital: City; owner: number; position: Position }>();
    for (const p of model.palaces) {
      const capital = state.getFeaturePartOf(p.position, Location.N);
      if (!(capital instanceof City)) continue;
      // only a completed capital is a kingdom
      if (!capital.isCompleted(state)) continue;
      const k = keyOf(capital) + "#" + p.owner;
      if (!kingdoms.has(k)) kingdoms.set(k, { capital, owner: p.owner, position: p.position });
    }

    const fields = state.getFeatures(Field).toArray() as Field[];
    for (const { capital, owner, position } of kingdoms.values()) {
      const capitalKey = keyOf(capital);
      const touched: Field[] = [];
      const cities = new Map<string, FeaturePointer>();
      const castles = new Map<string, FeaturePointer>();
      let coc = false;
      for (const field of fields) {
        const adjoining = field
          .getAdjoiningCities()
          .toArray()
          .map((fp) => state.getFeaturePartOf(fp.getPosition(), fp.getLocation()!))
          .filter((f): f is Feature => f !== null);
        if (!adjoining.some((f) => keyOf(f) === capitalKey)) continue;
        touched.push(field);
        for (const f of adjoining) {
          // only COMPLETED cities count (the capital always is, by now); a castle (a finished
          // city converted by its owner) counts as one city too
          if (f instanceof Castle) {
            const k = keyOf(f);
            if (!castles.has(k)) castles.set(k, f.getPlaces().head());
          } else if (f instanceof City && f.isCompleted(state)) {
            const k = keyOf(f);
            if (!cities.has(k)) cities.set(k, f.getPlaces().head());
          }
        }
        if (field.isAdjoiningCityOfCarcassonne()) coc = true;
      }
      const count = cities.size + castles.size + (coc ? 1 : 0);
      if (count === 0) continue;

      const items: ExprItem[] = [];
      if (cities.size > 0) {
        items.push(new ExprItem(cities.size, "cities", cities.size * KingdomPalaceCapability.POINTS_PER_CITY));
      }
      if (castles.size > 0) {
        items.push(new ExprItem(castles.size, "castles", castles.size * KingdomPalaceCapability.POINTS_PER_CITY));
      }
      if (coc) items.push(new ExprItem("coc", KingdomPalaceCapability.POINTS_PER_CITY));
      const capitalPtr =
        capital
          .getPlaces()
          .find((fp) => fp.getPosition().equals(position))
          .getOrNull() ?? capital.getPlaces().head();
      const source = new ScoreKingdomPointer(
        capitalPtr,
        touched.map((f) => f.getPlaces().head()),
        [...cities.values(), ...castles.values()],
        coc,
      );
      state = new AddPoints(
        new ReceivedPoints(new PointsExpression("kingdom", List.ofAll(items)), state.getPlayers().getPlayer(owner), source),
        true,
        true,
      ).apply(state);
    }
    return state;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace KingdomPalaceCapability {
  export class KingdomPalaceToken extends JavaEnum implements Token {
    static readonly KINGDOM_PALACE = new KingdomPalaceToken("KINGDOM_PALACE", 0);
    private static readonly VALUES: readonly KingdomPalaceToken[] = [KingdomPalaceToken.KINGDOM_PALACE];
    static values(): readonly KingdomPalaceToken[] {
      return KingdomPalaceToken.VALUES;
    }
  }
}

Capability.register(KingdomPalaceCapability);
