import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import type { Seq } from "../../../../io/vavr/Seq.js";
import { List } from "../../../../io/vavr/SeqTypes.js";
import { JavaEnum } from "../../../../lang/JavaEnum.js";
import type { Position } from "../../board/Position.js";
import { LittleBuildingAction } from "../../action/LittleBuildingAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { ExprItem } from "../../event/ExprItem.js";
import { Capability } from "../Capability.js";
import { Rule } from "../Rule.js";
import type { Token } from "../Token.js";
import type { GameState } from "../state/GameState.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";

/** Little Buildings (mini-expansion). Model: map of placed little buildings. */
export class LittleBuildingsCapability extends Capability<
  VMap<Position, LittleBuildingsCapability.LittleBuilding>
> {
  override onStartGame(state: GameState, random: RandomGenerator): GameState {
    const playersCount = state.getPlayers().getPlayers().length();
    const tokensCount = Math.trunc(6 / playersCount);
    const LB = LittleBuildingsCapability.LittleBuilding;
    state = state.mapPlayers((ps) => {
      ps = ps.setTokenCountForAllPlayers(LB.LB_HOUSE, tokensCount);
      ps = ps.setTokenCountForAllPlayers(LB.LB_SHED, tokensCount);
      ps = ps.setTokenCountForAllPlayers(LB.LB_TOWER, tokensCount);
      return ps;
    });
    return this.setModel(state, HashMap.empty<Position, LittleBuildingsCapability.LittleBuilding>());
  }

  override onActionPhaseEntered(state: GameState): GameState {
    const player = state.getTurnPlayer()!;
    const ps = state.getPlayers();
    const LB = LittleBuildingsCapability.LittleBuilding;
    const options = HashSet.ofAll(LB.values()).filter(
      (lb) => ps.getPlayerTokenCount(player.getIndex(), lb) > 0,
    ) as Set<LittleBuildingsCapability.LittleBuilding>;
    if (options.isEmpty()) return state;
    const pos = state.getLastPlaced()!.getPosition();
    return state.appendAction(new LittleBuildingAction(options, pos) as unknown as PlayerAction<unknown>);
  }

  static getBuildingsPoints(
    rules: GameState,
    buildings: Seq<LittleBuildingsCapability.LittleBuilding>,
  ): List<ExprItem> {
    const LB = LittleBuildingsCapability.LittleBuilding;
    let result: List<ExprItem> = List.empty<ExprItem>();
    if (rules.getStringRule(Rule.LITTLE_BUILDINGS_SCORING) === "3/2/1") {
      const counts = buildings.groupBy((t) => t).mapValues((l) => l.size());
      const shedCount = counts.getOrElse(LB.LB_SHED, 0);
      if (shedCount > 0) {
        result = result.append(
          new ExprItem(shedCount, "little-buildings." + LB.LB_SHED.name(), 1 * shedCount),
        ) as List<ExprItem>;
      }
      const houseCount = counts.getOrElse(LB.LB_HOUSE, 0);
      if (houseCount > 0) {
        result = result.append(
          new ExprItem(houseCount, "little-buildings." + LB.LB_HOUSE.name(), 2 * houseCount),
        ) as List<ExprItem>;
      }
      const towerCount = counts.getOrElse(LB.LB_TOWER, 0);
      if (towerCount > 0) {
        result = result.append(
          new ExprItem(towerCount, "little-buildings." + LB.LB_TOWER.name(), 3 * towerCount),
        ) as List<ExprItem>;
      }
    } else {
      const count = buildings.size();
      if (count > 0) {
        result = result.append(new ExprItem(count, "little-buildings", count)) as List<ExprItem>;
      }
    }
    return result;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LittleBuildingsCapability {
  export class LittleBuilding extends JavaEnum implements Token {
    static readonly LB_SHED = new LittleBuilding("LB_SHED", 0);
    static readonly LB_HOUSE = new LittleBuilding("LB_HOUSE", 1);
    static readonly LB_TOWER = new LittleBuilding("LB_TOWER", 2);
    private static readonly VALUES: readonly LittleBuilding[] = [
      LittleBuilding.LB_SHED,
      LittleBuilding.LB_HOUSE,
      LittleBuilding.LB_TOWER,
    ];
    static values(): readonly LittleBuilding[] {
      return LittleBuilding.VALUES;
    }
    static valueOf(name: string): LittleBuilding {
      const v = LittleBuilding.VALUES.find((t) => t.name() === name);
      if (v === undefined) throw new Error("No LittleBuilding " + name);
      return v;
    }
  }
}

Capability.register(LittleBuildingsCapability);
