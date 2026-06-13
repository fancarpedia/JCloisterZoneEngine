import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { type Set } from "../../../../io/vavr/Set.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import { Edge } from "../../board/Edge.js";
import type { EdgePattern } from "../../board/EdgePattern.js";
import { Location } from "../../board/Location.js";
import type { Position } from "../../board/Position.js";
import { Rotation } from "../../board/Rotation.js";
import type { PlacedTile } from "../../game/state/PlacedTile.js";
import { City } from "../../feature/City.js";
import { type Completable, isInstanceOfCompletable } from "../../feature/Completable.js";
import { CompletableFeature } from "../../feature/CompletableFeature.js";
import { Field } from "../../feature/Field.js";
import { Road } from "../../feature/Road.js";
import { Barn } from "../../figure/Barn.js";
import type { Follower } from "../../figure/Follower.js";
import { SmallFollower } from "../../figure/SmallFollower.js";
import type { PointsExpression } from "../../event/PointsExpression.js";
import type { Player } from "../../Player.js";
import { ScoreField } from "../../reducers/ScoreField.js";
import { ScoreFieldBarn } from "../../reducers/ScoreFieldBarn.js";
import type { GameState } from "../../game/state/GameState.js";
import type { GameStateRanking } from "../GameStateRanking.js";
import { CompletableRanking } from "./CompletableRanking.js";

/** A scored field reducer (ScoreField or ScoreFieldBarn). */
interface FieldScore {
  getOwners(): Set<Player>;
  getFeaturePointsForPlayer(player: Player): PointsExpression | null;
}

/** Legacy heuristic state-ranking AI (port of `ai/player/LegacyRanking`). Scores a
 *  game state from `me`'s perspective: own points/prospects positive, opponents' negative. */
export class LegacyRanking implements GameStateRanking {
  static readonly OPEN_ROAD_PENALTY = [0.0, 1.0, 2.5, 4.5, 7.5, 10.5, 14.5, 19.0, 29.0];
  static readonly OPEN_CITY_PENALTY = [0.0, 0.5, 1.5, 3.0, 5.0, 8.0, 12.0, 17.0, 27.0];
  static readonly OPEN_FIELD_PENALTY = [0.0, 5.0, 10.0, 19.0, 28.0, 37.0, 47.0, 57.0, 67.0];
  static readonly OPEN_CLOISTER_PENALTY = [0.0, 0.0, 0.4, 0.8, 1.2, 2.0, 4.0, 7.0, 11.0];

  private readonly me: Player;

  // ranking context (set per apply)
  private state!: GameState;
  private numberOfPlayers = 0;
  private remainingTurns = 0;
  private lastPlaced!: PlacedTile;
  private positionProbability!: VMap<Position, number>;
  private edges!: VMap<Edge, CompletableRanking>;
  private occupiedCompletables!: CompletableRanking[];
  private occupiedFields!: FieldScore[];

  constructor(me: Player) {
    this.me = me;
  }

  apply(state: GameState): number {
    let ranking = 0.0;
    this.state = state;
    this.numberOfPlayers = state.getPlayers().length();
    this.lastPlaced = state.getLastPlaced()!;
    this.positionProbability = this.getPositionProbability();
    this.remainingTurns = Math.ceil(state.getTilePack()!.totalSize() / this.numberOfPlayers);
    this.edges = HashMap.empty<Edge, CompletableRanking>();
    this.occupiedCompletables = [];
    this.occupiedFields = [];

    ranking += this.ratePoints();
    ranking += this.rateUnfinishedFeatures();
    ranking += this.rateOpenFeatures();
    ranking += this.rateMeeples();
    ranking += this.rateBoardShape();
    ranking += this.rateDragon();
    ranking += this.rateConnections();
    return ranking;
  }

  private ptsforPlayer(p: Player, pts: number): number {
    return p.getIndex() === this.me.getIndex() ? pts : -pts;
  }

  private getPositionProbability(): VMap<Position, number> {
    const packPatterns = this.state.getTilePack()!.getPatterns();
    let result: VMap<Position, number> = HashMap.empty<Position, number>();
    for (const avail of this.state.getAvailablePlacements()) {
      let matchingTiles = 0;
      for (const pattern of packPatterns) {
        if (avail._2.isMatchingAnyRotation(pattern._1 as EdgePattern)) {
          matchingTiles += pattern._2;
        }
      }
      let prob = 0.0;
      if (matchingTiles > 0) {
        prob = 1.0 - Math.pow(1.0 - 1.0 / this.numberOfPlayers, matchingTiles);
      }
      result = result.put(avail._1, prob);
    }
    return result;
  }

  private ratePoints(): number {
    let r = 0.0;
    const ps = this.state.getPlayers();
    const score = ps.getScore();
    for (const player of ps.getPlayers()) {
      r += this.ptsforPlayer(player, score.get(player.getIndex()));
    }
    return r;
  }

  private countCompleteProbability(completable: Completable): number {
    let prob = 1.0;
    if (completable instanceof CompletableFeature) {
      const cf = completable as CompletableFeature<never>;
      const adjacent = cf
        .getOpenEdges()
        .toArray()
        .map((edge) => (this.positionProbability.containsKey(edge.getP1()) ? edge.getP1() : edge.getP2()));
      prob = adjacent.reduce((res, p) => res * this.positionProbability.get(p).getOrElse(0), 1.0);
    }
    return prob;
  }

  private getCompletablePoints(cr: CompletableRanking): number {
    let prob = cr.getProbability();
    if (prob > 0.85) prob = 1.0;
    const uncertain = cr.getCompletePoints() - cr.getIncompletePoints();
    // multiply by 0.8 to advantage closed features
    return cr.getIncompletePoints() + prob * 0.8 * uncertain;
  }

  private rateOpenFeatures(): number {
    let r = 0.0;
    for (const player of this.state.getPlayers().getPlayers()) {
      let cloisters = 0,
        roads = 0,
        cities = 0,
        fields = 0;
      for (const cr of this.occupiedCompletables) {
        const owners = cr.getOwners();
        if (owners.size() !== 1) continue;
        if (owners.head().getIndex() !== player.getIndex()) continue;
        if (cr.getFeature() instanceof Road) roads += 1;
        else if (cr.getFeature() instanceof City) cities += 1;
      }
      for (const sfr of this.occupiedFields) {
        if (sfr.getOwners().contains(player)) fields += 1;
      }
      let pr = 0.0;
      pr -= LegacyRanking.OPEN_ROAD_PENALTY[roads];
      pr -= LegacyRanking.OPEN_CITY_PENALTY[cities];
      pr -= LegacyRanking.OPEN_CLOISTER_PENALTY[cloisters];
      pr -= LegacyRanking.OPEN_FIELD_PENALTY[fields];
      r += this.ptsforPlayer(player, pr);
    }
    return r;
  }

  private rateUnfinishedFeatures(): number {
    let r = 0.0;
    for (const feature of this.state.getFeatures()) {
      if (!isInstanceOfCompletable(feature)) continue;
      const completable = feature as unknown as Completable;
      const cr = new CompletableRanking(this.state, completable);
      let fr = 0.0;
      if (completable instanceof CompletableFeature) {
        const cf = completable as CompletableFeature<never>;
        for (const edge of cf.getOpenEdges()) {
          this.edges = this.edges.put(edge, cr);
        }
        this.occupiedCompletables.push(cr);
      }
      const prob = this.countCompleteProbability(completable);
      cr.setProbability(prob);
      let penalty: Tuple2<number, number> | null = null;
      if (prob < 0.0001) penalty = new Tuple2(12.0, 3.0);
      else if (prob < 0.2) penalty = new Tuple2(3.0, 0.75);
      else if (prob < 0.55) penalty = new Tuple2(1.2, 0.3);

      if (this.remainingTurns > 7 && penalty !== null) {
        for (const follower of completable.getFollowers(this.state)) {
          if (follower.getPlayer().getIndex() === this.me.getIndex()) fr -= penalty._1;
          else fr += penalty._2;
        }
      }
      const points = this.getCompletablePoints(cr);
      for (const player of cr.getOwners()) {
        fr += this.ptsforPlayer(player, points);
      }
      r += fr;
    }

    for (const field of this.state.getFeatures(Field)) {
      const hasBarn = field.getSpecialMeeples(this.state).find((m) => m instanceof Barn).isDefined();
      const sr: FieldScore = hasBarn ? new ScoreFieldBarn(field, true) : new ScoreField(field, true);
      (sr as unknown as { apply(s: GameState): GameState }).apply(this.state);
      this.occupiedFields.push(sr);
      for (const player of sr.getOwners()) {
        let q = -0.99;
        if (player.getIndex() !== this.me.getIndex()) q = -q;
        const fq = sr.getFeaturePointsForPlayer(player)!.getPoints();
        r += q * fq;
      }
    }
    return r;
  }

  private rateMeeples(): number {
    let r = 0.0;
    for (const player of this.state.getPlayers().getPlayers()) {
      const q = player.getIndex() === this.me.getIndex() ? 1.0 : -1.0;
      let inSupply = 0;
      for (const f of player.getFollowers(this.state).filter((x) => x.isInSupply(this.state))) {
        // instanceof can't be used because of Phantom (extends Follower)
        if ((f as object).constructor === SmallFollower) r += q * 0.15;
        else r += q * 0.25;
        inSupply += 1;
      }
      if (inSupply === 0) r += this.ptsforPlayer(player, -4.0);
    }
    return r;
  }

  private rateDragon(): number {
    const pos = this.state.getNeutralFigures().getDragonDeployment();
    if (pos === null) return 0.0;
    let r = 0.0;
    for (const t of this.state.getDeployedMeeples()) {
      const dist = t._2.getPosition().squareDistance(pos);
      if (dist > 3) continue;
      r -= this.ptsforPlayer(t._1.getPlayer(), 3 - dist);
    }
    return r;
  }

  private rateBoardShape(): number {
    return 0.0001 * this.state.getAdjacentTiles2(this.lastPlaced.getPosition()).size();
  }

  private getCombinedPowers(r1: CompletableRanking, r2: CompletableRanking): VMap<Player, number> {
    let combinedPowers = r1.getPowers();
    for (const t of r2.getPowers()) {
      const p = combinedPowers.get(t._1).getOrElse(0);
      combinedPowers = combinedPowers.put(t._1, p + t._2);
    }
    return combinedPowers;
  }

  private rateConnection(e1: Edge, e2: Edge, prob: number): number {
    let r1 = this.edges.get(e1).getOrNull();
    let r2 = this.edges.get(e2).getOrNull();
    if (
      r1 === null ||
      r2 === null ||
      (r1.getFeature() as object).constructor !== (r2.getFeature() as object).constructor
    ) {
      return 0.0;
    }
    if (r2.getOwnersPower() > r1.getOwnersPower()) {
      const tmp = r2;
      r2 = r1;
      r1 = tmp;
    }
    if (r1.getOwnersPower() === 0) return 0.0;

    const combinedPowers = this.getCombinedPowers(r1, r2);
    let combinedMaxPower = 0;
    for (const v of combinedPowers.values()) combinedMaxPower = Math.max(combinedMaxPower, v);
    const combinedOwners = combinedPowers.keySet().filter((p) => combinedPowers.get(p).get() === combinedMaxPower);
    const loss1 = r1.getOwners().diff(combinedOwners);
    const loss2 = r2.getOwners().diff(combinedOwners);
    const gain1 = combinedOwners.diff(r1.getOwners());
    const gain2 = combinedOwners.diff(r2.getOwners());
    const featurePoints1 = this.getCompletablePoints(r1);
    const featurePoints2 = this.getCompletablePoints(r2);
    const points1 = 0.5 * prob * featurePoints1;
    const points2 = 0.5 * prob * featurePoints2;
    let r = 0.0;
    for (const p of loss1) r -= this.ptsforPlayer(p, points1);
    for (const p of loss2) r -= this.ptsforPlayer(p, points2);
    for (const p of gain1) r += this.ptsforPlayer(p, points1);
    for (const p of gain2) r += this.ptsforPlayer(p, points2);
    return r;
  }

  private rateConnections(): number {
    let r = 0.0;
    for (const pp of this.positionProbability) {
      if (pp._2 < 0.55) continue;
      const pos = pp._1;
      for (const loc of Location.SIDES) {
        r += this.rateConnection(new Edge(pos, loc), new Edge(pos, loc.rotateCW(Rotation.R90)), pp._2);
      }
    }
    return r;
  }
}
