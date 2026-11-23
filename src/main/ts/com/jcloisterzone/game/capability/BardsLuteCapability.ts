import { HashSet, type Set as VSet } from "../../../../io/vavr/Set.js";
import { JavaEnum } from "../../../../lang/JavaEnum.js";
import type { PlacementOption } from "../../board/PlacementOption.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import type { Position } from "../../board/Position.js";
import type { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import { ExprItem } from "../../event/ExprItem.js";
import { City } from "../../feature/City.js";
import { Field } from "../../feature/Field.js";
import { Garden } from "../../feature/Garden.js";
import { Monastery } from "../../feature/Monastery.js";
import { Road } from "../../feature/Road.js";
import type { Structure } from "../../feature/Structure.js";
import { PlaceTile } from "../../reducers/PlaceTile.js";
import type { XmlElement } from "../../XmlUtils.js";
import { Capability } from "../Capability.js";
import { Rule } from "../Rule.js";
import type { Token } from "../Token.js";
import type { GameState } from "../state/GameState.js";

/** The notes on the board: the feature pointer each one was placed on. */
export type BardsLuteModel = VSet<FeaturePointer>;

/**
 * Bards of Carcassonne (fan add-on), rules: wikicarpedia.com/car/Bards_of_Carcassonne_(Fan_Expansion).
 *
 *  - A Lute tile (`bards-lute` attribute on the `<tile>`) may only be placed where a note can go: at
 *    least one of its features (city, road, field, monastery, garden) is unoccupied.
 *  - Then the player MUST put a note on one unoccupied feature of that tile (BardsLutePhase).
 *  - A meeple may not go on the feature that received the note this turn (later turns: allowed).
 *  - A completed city / road with a note: +1 per tile (advanced variant `bards-notes-stack`: +1 per
 *    tile per note). An unfinished city / road with a note scores nothing at the end.
 *  - A field with a note: +1 per completed city / castle at the end (advanced: per note).
 *  - The bonus is part of the feature's score, so everything scoring "the feature" (castle, witch,
 *    labyrinth, barn) includes it; wells score as usual.
 *  - Notes stay on the board for the whole game — also after their feature is scored.
 *
 * Ported from the Java `bards` branch (2021–2022) and corrected to the rules above. The element is
 * opt-out: without `bards-lute` the lute tiles are ordinary tiles.
 */
export class BardsLuteCapability extends Capability<BardsLuteModel> {
  static readonly simpleName = "BardsLuteCapability";
  static readonly BARDS_LUTE = new TileModifier("BardsLute");

  override initTile(_state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (tileElement.hasAttribute("bards-lute")) {
      tile = tile.addTileModifier(BardsLuteCapability.BARDS_LUTE);
    }
    return tile;
  }

  override onStartGame(state: GameState): GameState {
    return this.setModel(state, HashSet.empty<FeaturePointer>());
  }

  /** The features of the tile at `pos` a note may go on: every unoccupied city, road, field ("all
   *  features including fields" — also without farmers), monastery and garden. */
  static noteOptions(state: GameState, pos: Position): FeaturePointer[] {
    const out: FeaturePointer[] = [];
    for (const t of state.getTileFeatures2(pos)) {
      const f = t._2;
      if (!(f instanceof City || f instanceof Road || f instanceof Field || f instanceof Monastery || f instanceof Garden)) continue;
      if ((f as unknown as Structure).isOccupied(state)) continue;
      out.push(t._1);
    }
    return out;
  }

  /** "When a note token cannot be placed because all features are occupied, the tile must be
   *  placed elsewhere" — a lute tile only where at least one of its features stays free. */
  override isTilePlacementAllowed(state: GameState, tile: Tile, placement: PlacementOption): boolean {
    if (!tile.hasModifier(BardsLuteCapability.BARDS_LUTE)) return true;
    const pos = placement.getPosition();
    const placed = new PlaceTile(tile, pos, placement.getRotation()).apply(state);
    return BardsLuteCapability.noteOptions(placed, pos).length > 0;
  }

  /** The notes on the board (empty without the capability). */
  static getNotes(state: GameState): BardsLuteModel {
    if (!state.hasCapability(BardsLuteCapability as never)) return HashSet.empty<FeaturePointer>();
    return state.getCapabilityModel<BardsLuteModel>(BardsLuteCapability as never) ?? HashSet.empty<FeaturePointer>();
  }

  /** How many notes lie on a feature (its places). */
  static countNotes(state: GameState, places: Iterable<FeaturePointer>): number {
    const notes = BardsLuteCapability.getNotes(state);
    if (notes.size() === 0) return 0;
    let n = 0;
    for (const fp of places) if (notes.contains(fp)) n++;
    return n;
  }

  /** The bard's bonus of a feature with notes: `perNote` points (+1 per tile / per completed city),
   *  once — or once per note in the advanced variant. Null when the feature has no note. */
  static bonus(state: GameState, places: Iterable<FeaturePointer>, perNote: number): ExprItem | null {
    const notes = BardsLuteCapability.countNotes(state, places);
    if (notes === 0) return null;
    const stack = state.getBooleanRule(Rule.BARDS_NOTES_STACK);
    return new ExprItem(notes, "bardsnotes", perNote * (stack ? notes : 1));
  }

  /** The features that got a note this turn: the notes on the tile just placed (a lute tile gets its
   *  note right after it is placed, and no other note ever lands on it). */
  static featuresNotedThisTurn(state: GameState): Array<{ getPlaces(): { contains(fp: FeaturePointer): boolean } }> {
    const placed = state.getLastPlaced();
    if (placed === null) return [];
    const pos = placed.getPosition();
    const out: Array<{ getPlaces(): { contains(fp: FeaturePointer): boolean } }> = [];
    for (const fp of BardsLuteCapability.getNotes(state)) {
      if (!fp.getPosition().equals(pos)) continue;
      const f = state.getFeature(fp);
      if (f !== null) out.push(f as unknown as { getPlaces(): { contains(fp: FeaturePointer): boolean } });
    }
    return out;
  }
}

export namespace BardsLuteCapability {
  export class BardsLuteToken extends JavaEnum implements Token {
    static readonly BARDS_NOTE = new BardsLuteToken("BARDS_NOTE", 0);
    private static readonly VALUES: readonly BardsLuteToken[] = [BardsLuteToken.BARDS_NOTE];
    static values(): readonly BardsLuteToken[] {
      return BardsLuteToken.VALUES;
    }
  }
}

Capability.register(BardsLuteCapability);
