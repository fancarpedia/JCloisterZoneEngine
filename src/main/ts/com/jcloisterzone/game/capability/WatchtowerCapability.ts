import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { List } from "../../../../io/vavr/SeqTypes.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import { Position } from "../../board/Position.js";
import { TileModifier } from "../../board/TileModifier.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { ScoreMeeplePositionsPointer } from "../../board/pointer/ScoreMeeplePositionsPointer.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints, type ScoredMeeple } from "../../event/ScoreEvent.js";
import { City } from "../../feature/City.js";
import type { Completable } from "../../feature/Completable.js";
import type { Feature } from "../../feature/Feature.js";
import { Monastery } from "../../feature/Monastery.js";
import { Road } from "../../feature/Road.js";
import { Follower } from "../../figure/Follower.js";
import type { Meeple } from "../../figure/Meeple.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import { Capability } from "../Capability.js";
import type { GameState } from "../state/GameState.js";
import type { PlacedTile } from "../state/PlacedTile.js";

/** Watchtowers mini-expansion: a watchtower tile grants its meeple owner(s) a bonus when the
 *  feature the meeple sits on is scored. The bonus = `points` × (count of the subject thing in
 *  the watchtower's 3×3 neighbourhood). Subjects: coat-of-arms (pennants), monastery, city,
 *  road, meeple (adjacent followers). */
export class WatchtowerModifier extends TileModifier {
  readonly points: number;
  readonly subject: string;

  constructor(type: string) {
    super("Watchtower:" + type);
    const idx = type.indexOf("/");
    this.points = parseInt(type.substring(0, idx), 10);
    this.subject = type.substring(idx + 1);
  }
}

export class WatchtowerCapability extends Capability<void> {
  override beforeCompletableScore(state: GameState, features: Set<Completable>): GameState {
    const watchtowers = new Map<string, WatchtowerModifier>();
    const watchtowerPos = new Map<string, Position>();
    const watchtowerMeeples = new Map<string, Array<Tuple2<Meeple, FeaturePointer>>>();

    for (const t of state.getPlacedTiles()) {
      const pos = t._1;
      for (const mod of t._2.getTile().getTileModifiers()) {
        if (mod instanceof WatchtowerModifier) {
          watchtowers.set(pos.toString(), mod);
          watchtowerPos.set(pos.toString(), pos);
        }
      }
    }

    if (watchtowers.size === 0) {
      return state;
    }

    for (const t of state.getDeployedMeeples()) {
      const fp = t._2;
      const key = fp.getPosition().toString();
      if (!watchtowers.has(key)) continue;
      let onScored = false;
      for (const f of features) {
        if (f.getPlaces().contains(fp)) {
          onScored = true;
          break;
        }
      }
      if (!onScored) continue;
      let arr = watchtowerMeeples.get(key);
      if (arr === undefined) {
        arr = [];
        watchtowerMeeples.set(key, arr);
      }
      arr.push(t);
    }

    for (const [key, meeples] of watchtowerMeeples) {
      const pos = watchtowerPos.get(key)!;
      const watchtower = watchtowers.get(key)!;
      let count = 0;
      let exprName: string | null = null;
      // what was counted — highlighted in the history (TS-only)
      const involved: FeaturePointer[] = [];
      const involvedMeeples: ScoredMeeple[] = [];

      const pts: PlacedTile[] = this.getNeigbouring(state, pos);
      let positions: Set<Position> = HashSet.empty<Position>();
      for (const pt of pts) positions = positions.add(pt.getPosition());

      switch (watchtower.subject) {
        case "coat-of-arms": {
          for (const pt of pts) {
            for (const f of pt.getTile().getInitialFeatures().values()) {
              if (f instanceof City) {
                const fp = (f as City)
                  .getPlaces()
                  .head()
                  .setPosition(pt.getPosition())
                  .rotateCW(pt.getRotation());
                const city = state.getFeature(fp) as City | null;
                if (city !== null) {
                  // City still exists (not converted to Castle)
                  if (!city.hasModifier(state, City.ELIMINATED_PENNANTS)) {
                    const pennants = (f as City).getModifier(state, City.PENNANTS, 0);
                    count += pennants;
                    if (pennants > 0) involved.push(fp); // the city segment with the coat of arms
                  }
                }
              }
            }
          }
          exprName = "pennants";
          break;
        }
        case "monastery": {
          for (const pt of pts) {
            for (const f of pt.getTile().getInitialFeatures().values()) {
              if (f instanceof Monastery) {
                count++;
                involved.push(
                  (f as Monastery).getPlaces().head().setPosition(pt.getPosition()).rotateCW(pt.getRotation()),
                );
              }
            }
          }
          exprName = "monasteries";
          break;
        }
        case "city": {
          for (const pt of pts) {
            const cityFps = state
              .getFeatureMap()
              .get(pt.getPosition())
              .get()
              .keySet()
              .filter((fp) => fp.getFeature() === (City as never))
              .toArray();
            if (cityFps.length > 0) count++;
            involved.push(...cityFps);
          }
          exprName = "cities";
          break;
        }
        case "road": {
          for (const pt of pts) {
            const roadFps = state
              .getFeatureMap()
              .get(pt.getPosition())
              .get()
              .keySet()
              .filter((fp) => fp.getFeature() === (Road as never))
              .toArray();
            if (roadFps.length > 0) count++;
            involved.push(...roadFps);
          }
          exprName = "roads";
          break;
        }
        case "meeple": {
          for (const t of state.getDeployedMeeples()) {
            if (!(t._1 instanceof Follower)) continue;
            const mpos = t._2.getPosition();
            if (Math.abs(pos.x - mpos.x) <= 1 && Math.abs(pos.y - mpos.y) <= 1) {
              count++;
              involvedMeeples.push(new Tuple2(t._1 as Follower, t._2) as ScoredMeeple);
            }
          }
          exprName = "meeples";
          break;
        }
      }

      if (count > 0) {
        const expr = new PointsExpression(
          "watchtower",
          new ExprItem(count, exprName!, count * watchtower.points),
        );
        const receivedPoints: ReceivedPoints[] = meeples.map((t) =>
          new ReceivedPoints(
            expr,
            t._1.getPlayer(),
            new ScoreMeeplePositionsPointer(t._1.getDeployment(state)!, t._1.getId(), positions),
            // the meeple on the watchtower that earned the bonus, where it stood
            List.of(new Tuple2(t._1 as Follower, t._2) as ScoredMeeple),
          ).withInvolved(involved, involvedMeeples),
        );
        state = new AddPoints(List.ofAll(receivedPoints), true).apply(state);
      }
    }

    return state;
  }

  private getNeigbouring(state: GameState, pos: Position): PlacedTile[] {
    const out: PlacedTile[] = [];
    for (const pt of state.getAdjacentAndDiagonalTiles(pos)) out.push(pt);
    const self = state.getPlacedTile(pos);
    if (self !== null) out.push(self);
    return out;
  }
}

Capability.register(WatchtowerCapability);
