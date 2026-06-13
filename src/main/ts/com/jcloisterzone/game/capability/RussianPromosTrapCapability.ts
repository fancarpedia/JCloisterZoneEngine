import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { List } from "../../../../io/vavr/SeqTypes.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import type { Player } from "../../Player.js";
import { getElementStreamByTagName, type XmlElement } from "../../XmlUtils.js";
import { Location } from "../../board/Location.js";
import type { Position } from "../../board/Position.js";
import type { Tile } from "../../board/Tile.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { MeeplePointer } from "../../board/pointer/MeeplePointer.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { Castle } from "../../feature/Castle.js";
import type { Feature } from "../../feature/Feature.js";
import { Road } from "../../feature/Road.js";
import { SoloveiRazboynik } from "../../feature/SoloveiRazboynik.js";
import { Vodyanoy } from "../../feature/Vodyanoy.js";
import { Follower } from "../../figure/Follower.js";
import { ReturnMeepleAction } from "../../action/ReturnMeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import { DeployMeeple } from "../../reducers/DeployMeeple.js";
import { Capability } from "../Capability.js";
import { ReturnMeepleSource } from "../ReturnMeepleSource.js";
import type { GameState } from "../state/GameState.js";

/** Russian Promos trap features (Vodyanoy + Solovei Razboynik): they expose nearby followers,
 *  re-trapping them after the next placement, and Vodyanoy penalises trapped followers. */
export class RussianPromosTrapCapability extends Capability<void> {
  override initTile(_state: GameState, tile: Tile, tileElement: XmlElement): Tile {
    if (!getElementStreamByTagName(tileElement, "razboynik").isEmpty()) {
      const razboynik = new SoloveiRazboynik();
      tile = tile.setInitialFeatures(
        tile.getInitialFeatures().put(razboynik.getPlace(), razboynik as unknown as Feature),
      );
    }
    if (!getElementStreamByTagName(tileElement, "vodyanoy").isEmpty()) {
      const vodyanoy = new Vodyanoy();
      tile = tile.setInitialFeatures(
        tile.getInitialFeatures().put(vodyanoy.getPlace(), vodyanoy as unknown as Feature),
      );
    }
    return tile;
  }

  override isMeepleDeploymentAllowed(state: GameState, pos: Position): boolean {
    return state
      .getPlacedTile(pos)!
      .getTile()
      .getInitialFeatures()
      .keySet()
      .filter((fp) => fp.getFeature() === (Vodyanoy as never))
      .isEmpty();
  }

  override onActionPhaseEntered(state: GameState): GameState {
    let actions = state.getPlayerActions();
    if (actions === null) return state;
    let places: Set<MeeplePointer> = HashSet.empty<MeeplePointer>();
    const active = state.getActivePlayer();
    const placeTilePos = state.getLastPlaced()!.getPosition();
    for (const t of state.getDeployedMeeples()) {
      const meeple = t._1;
      const fp = t._2;
      const feature = state.getFeature(fp);
      if (
        active !== null &&
        meeple.getPlayer().equals(active) &&
        !fp.getPosition().equals(placeTilePos) &&
        (feature instanceof SoloveiRazboynik || feature instanceof Vodyanoy)
      ) {
        places = places.add(new MeeplePointer(fp, meeple.getId()));
      }
    }
    if (!places.isEmpty()) {
      actions = actions.appendAction(
        new ReturnMeepleAction(places, ReturnMeepleSource.TRAP) as unknown as PlayerAction<unknown>,
      );
      state = state.setPlayerActions(actions);
    }
    return state;
  }

  override onFinalScoring(state: GameState): GameState {
    for (const vodyanoy of state.getFeatures(Vodyanoy)) {
      const receivedPoints: ReceivedPoints[] = [];
      const counts = vodyanoy
        .getFollowers(state)
        .foldLeft(HashMap.empty<Player, number>() as VMap<Player, number>, (acc, follower) => {
          const player = follower.getPlayer();
          return acc.put(player, acc.get(player).getOrElse(0) + 1);
        });

      for (const t of counts) {
        const player = t._1;
        const followersCount = t._2;
        const expr = new PointsExpression(
          "vodyanoy",
          new ExprItem(followersCount, "meeples", -2 * followersCount),
        );
        const sample = vodyanoy.getSampleFollower2(state, player);
        receivedPoints.push(new ReceivedPoints(expr, player, sample === null ? null : sample._2));
      }

      if (receivedPoints.length > 0) {
        state = new AddPoints(List.ofAll(receivedPoints), true, true).apply(state);
      }
    }
    return state;
  }

  findExposedFollowers(state: GameState): RussianPromosTrapCapability.ExposedFollower[] {
    const result: RussianPromosTrapCapability.ExposedFollower[] = [];
    const alreadyExposed = new globalThis.Set<string>();

    for (const feature of state.getFeatures()) {
      if (feature instanceof SoloveiRazboynik) {
        const pos = feature.getPlaces().head().getPosition();
        let road = state.getFeature(new FeaturePointer(pos, Road as never, Location.WE)) as Road | null;
        if (road === null) {
          road = state.getFeature(new FeaturePointer(pos, Road as never, Location.NS)) as Road | null;
        }
        if (road === null) continue;
        const trap = new FeaturePointer(pos, SoloveiRazboynik as never, Location.I);
        for (const t of road.getFollowers2(state)) {
          const meeple = t._1;
          if (!alreadyExposed.has(meeple.getId())) {
            result.push(new RussianPromosTrapCapability.ExposedFollower(meeple, trap));
            alreadyExposed.add(meeple.getId());
          }
        }
      } else if (feature instanceof Vodyanoy) {
        const pos = feature.getPlaces().head().getPosition();
        const trap = new FeaturePointer(pos, Vodyanoy as never, Location.I);
        for (const t of state.getDeployedMeeples()) {
          const meeple = t._1;
          if (!(meeple instanceof Follower)) continue;
          if (alreadyExposed.has(meeple.getId())) continue;
          const fp = t._2;
          const p = fp.getPosition();
          const f = state.getFeature(fp);
          if (
            fp.getLocation()!.isCityOfCarcassonneQuarter() ||
            f instanceof Vodyanoy ||
            f instanceof SoloveiRazboynik ||
            f instanceof Castle
          ) {
            continue;
          }
          if (Math.abs(p.x - pos.x) <= 1 && Math.abs(p.y - pos.y) <= 1 && !pos.equals(p)) {
            result.push(new RussianPromosTrapCapability.ExposedFollower(meeple, trap));
            alreadyExposed.add(meeple.getId());
          }
        }
      }
    }
    return result;
  }

  trapFollowers(
    state: GameState,
    exposedFollowers: RussianPromosTrapCapability.ExposedFollower[] = this.findExposedFollowers(state),
  ): GameState {
    for (const exposed of exposedFollowers) {
      state = new DeployMeeple(exposed.getFollower(), exposed.getTrap()).apply(state);
    }
    return state;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace RussianPromosTrapCapability {
  export class ExposedFollower {
    constructor(
      private readonly follower: Follower,
      private readonly trap: FeaturePointer,
    ) {}
    getFollower(): Follower {
      return this.follower;
    }
    getTrap(): FeaturePointer {
      return this.trap;
    }
  }
}

Capability.register(RussianPromosTrapCapability);
