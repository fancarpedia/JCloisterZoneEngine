import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import { Position } from "../../board/Position.js";
import type { Tile } from "../../board/Tile.js";
import { TileModifier } from "../../board/TileModifier.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { DiceSixRollEvent } from "../../event/DiceSixRollEvent.js";
import { FlierDiceRollEvent } from "../../event/FlierDiceRollEvent.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import { Castle } from "../../feature/Castle.js";
import { isInstanceOfTopLeftTranslatedFigurePosition } from "../../figure/TopLeftTranslatedFigurePosition.js";
import type { NeutralFigure } from "../../figure/neutral/NeutralFigure.js";
import { ReturnNeutralFigure } from "../../reducers/ReturnNeutralFigure.js";
import { UndeployMeeple } from "../../reducers/UndeployMeeple.js";
import { Capability } from "../Capability.js";
import { Rule } from "../Rule.js";
import { isInstanceOfMeteoriteProtected } from "./trait/MeteoriteProtected.js";
import type { GameState } from "../state/GameState.js";

const P = (x: number, y: number) => new Position(x, y);

/** Meteorites (fan expansion) — placing a crater tile triggers an impact: a die roll picks a
 *  blast radius and every meeple/neutral figure standing on those tiles is knocked off. */
export class MeteoriteCapability extends Capability<void> {
  static readonly CRATER = new TileModifier("Crater");

  static readonly STANDARD_1: Set<Position> = HashSet.of(P(0, 0));
  static readonly STANDARD_2: Set<Position> = HashSet.of(P(-1, 0), P(0, -1), P(0, 0), P(0, 1), P(1, 0));
  static readonly STANDARD_3: Set<Position> = HashSet.of(
    P(-2, 0), P(-1, -1), P(-1, 0), P(-1, 1), P(0, -2), P(0, -1), P(0, 0), P(0, 1), P(0, 2),
    P(1, -1), P(1, 0), P(1, 1), P(2, 0),
  );
  static readonly EXTENDED_1: Set<Position> = HashSet.of(P(-1, 0), P(0, -1), P(0, 0), P(0, 1), P(1, 0));
  static readonly EXTENDED_2: Set<Position> = HashSet.of(
    P(-1, -1), P(-1, 0), P(-1, 1), P(0, -1), P(0, 0), P(0, 1), P(1, -1), P(1, 0), P(1, 1),
  );
  static readonly EXTENDED_3: Set<Position> = HashSet.of(
    P(2, -1), P(2, 0), P(2, 1), P(1, -2), P(1, -1), P(1, 0), P(1, 1), P(1, 2),
    P(0, -2), P(0, -1), P(0, 0), P(0, 1), P(0, 2),
    P(-1, -2), P(-1, -1), P(-1, 0), P(-1, 1), P(-1, 2), P(-2, -1), P(-2, 0), P(-2, 1),
  );

  override initTile(_state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (!getElementStreamByTagName(tileElement, "crater").isEmpty()) {
      tile = tile.addTileModifier(MeteoriteCapability.CRATER);
    }
    return tile;
  }

  confirmedTilePlacement(state: GameState): GameState {
    const pt = state.getLastPlaced()!;
    if (!pt.getTile().hasModifier(MeteoriteCapability.CRATER)) return state;

    const M = MeteoriteCapability;
    const rule = state.getStringRule(Rule.METEORITE_IMPACT);
    const diceValue = state.getPhase()!.getRandom().getNextInt(6) + 1;

    let impact: Set<Position>;
    switch (diceValue) {
      case 6: impact = rule === "standard" ? M.STANDARD_3 : M.EXTENDED_3; break;
      case 5: impact = rule === "extended" ? M.EXTENDED_3 : M.STANDARD_3; break;
      case 4: impact = rule === "standard" ? M.STANDARD_2 : M.EXTENDED_2; break;
      case 3: impact = rule === "extended" ? M.EXTENDED_2 : M.STANDARD_2; break;
      case 2: impact = rule === "standard" ? M.STANDARD_1 : M.EXTENDED_1; break;
      case 1: impact = rule === "extended" ? M.EXTENDED_1 : M.STANDARD_1; break;
      default: throw new Error("Invalid distance " + diceValue);
    }

    const positions: Set<Position> = impact.map((p) => pt.getPosition().add(p));
    const type = `meteorite-impact.${rule}`;

    if (rule === "combination") {
      state = state.appendEvent(
        new DiceSixRollEvent(PlayEventMeta.createWithActivePlayer(state), positions, diceValue, type),
      );
    } else {
      const impactValue = Math.ceil(diceValue / 2.0);
      state = state.appendEvent(
        new FlierDiceRollEvent(PlayEventMeta.createWithActivePlayer(state), positions, impactValue, type),
      );
    }

    for (const t of state.getDeployedMeeples()) {
      const m = t._1;
      if (isInstanceOfMeteoriteProtected(m)) continue;
      const position = t._2.getPosition();
      let undeploy: boolean;
      if (isInstanceOfTopLeftTranslatedFigurePosition(m)) {
        // corner-anchored figure (Barn/Obelisk): it sits at a corner of up to 4 tiles
        undeploy =
          positions.contains(position) ||
          positions.contains(position.add(P(-1, 0))) ||
          positions.contains(position.add(P(0, -1))) ||
          positions.contains(position.add(P(-1, -1)));
      } else {
        const feature = state.getFeature(t._2);
        if (feature instanceof Castle) {
          // impact can hit just part of a castle
          undeploy = feature.getPlaces().filter((p) => positions.contains(p.getPosition())).size() > 0;
        } else if (t._2.getLocation()!.isCityOfCarcassonneQuarter()) {
          undeploy = false;
        } else {
          undeploy = positions.contains(position);
        }
      }
      if (undeploy) {
        state = new UndeployMeeple(m, true).apply(state);
      }
    }

    for (const t of state.getNeutralFigures().getDeployedNeutralFigures()) {
      const f = t._1;
      if (isInstanceOfMeteoriteProtected(f)) continue;
      if (positions.contains(t._2.getPosition())) {
        state = new ReturnNeutralFigure(f as unknown as NeutralFigure<BoardPointer>).apply(state);
      }
    }

    for (const cap of state.getCapabilities().toSeq()) {
      state = cap.onMeteoriteImpact(state, pt, positions);
    }

    return state;
  }
}

Capability.register(MeteoriteCapability);
