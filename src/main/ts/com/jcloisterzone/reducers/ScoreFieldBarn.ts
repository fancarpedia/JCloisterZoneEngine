import { HashMap, type Map as VMap } from "../../../io/vavr/Map.js";
import { List } from "../../../io/vavr/SeqTypes.js";
import { type Set } from "../../../io/vavr/Set.js";
import type { Player } from "../Player.js";
import type { PointsExpression } from "../event/PointsExpression.js";
import { ReceivedPoints } from "../event/ScoreEvent.js";
import type { Field } from "../feature/Field.js";
import type { Scoreable } from "../feature/Scoreable.js";
import { Barn } from "../figure/Barn.js";
import type { ScoreFeatureReducer } from "../game/ScoreFeatureReducer.js";
import type { GameState } from "../game/state/GameState.js";
import { AddPoints } from "./AddPoints.js";

/** Final scoring of a field with one or more barns: each owning player scores the
 *  barn value once (multiple barns of the same player don't stack). */
export class ScoreFieldBarn implements ScoreFeatureReducer {
  private readonly field: Field;
  private readonly isFinal: boolean;
  private playerPoints: VMap<Player, PointsExpression> = HashMap.empty();

  constructor(field: Field, isFinal: boolean) {
    this.field = field;
    this.isFinal = isFinal;
  }

  getFeature(): Scoreable {
    return this.field as unknown as Scoreable;
  }

  apply(state: GameState): GameState {
    const barns = this.field.getSpecialMeeples2(state).filter((t) => t._1 instanceof Barn);
    const expr = this.field.getBarnPoints(state);
    let receivedPoints: List<ReceivedPoints> = List.empty<ReceivedPoints>();
    const scoredPlayers = new globalThis.Set<number>();

    for (const t of barns) {
      const player = (t._1 as Barn).getPlayer();
      if (scoredPlayers.has(player.getIndex())) continue; // one barn per player scores
      this.playerPoints = this.playerPoints.put(player, expr);
      receivedPoints = receivedPoints.append(new ReceivedPoints(expr, player, t._2)) as List<ReceivedPoints>;
      scoredPlayers.add(player.getIndex());
    }

    return new AddPoints(receivedPoints, true, this.isFinal).apply(state);
  }

  getOwners(): Set<Player> {
    return this.playerPoints.keySet();
  }

  getFeaturePoints(): PointsExpression {
    throw new Error("Call getFeaturePointsForPlayer(player)");
  }

  getFeaturePointsForPlayer(player: Player): PointsExpression | null {
    return this.playerPoints.get(player).getOrNull();
  }
}
