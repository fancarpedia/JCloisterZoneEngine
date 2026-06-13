import type { ClassToken } from "../../../lang/Class.js";
import { List, type Arr } from "../../../io/vavr/SeqTypes.js";
import { RansomPaidEvent } from "../event/RansomPaidEvent.js";
import { PlayEventMeta } from "../event/PlayEvent.js";
import { ExprItem } from "../event/ExprItem.js";
import { PointsExpression } from "../event/PointsExpression.js";
import { ReceivedPoints } from "../event/ScoreEvent.js";
import type { Follower } from "../figure/Follower.js";
import type { Player } from "../Player.js";
import type { Capability } from "../game/Capability.js";
import { TowerCapability } from "../game/capability/TowerCapability.js";
import { Flag } from "../game/state/Flag.js";
import type { GameState } from "../game/state/GameState.js";
import { AddPoints } from "./AddPoints.js";
import type { Reducer } from "./Reducer.js";

const TOWER_CLS = TowerCapability as unknown as ClassToken<Capability<Arr<List<Follower>>>>;

/** Pay 3 points to the jailer to free one of your captured followers (once per turn). */
export class PayRansom implements Reducer {
  constructor(private readonly meepleId: string) {}

  apply(state: GameState): GameState {
    if (state.hasFlag(Flag.RANSOM_PAID)) {
      throw new Error("Ransom can be paid only once a turn.");
    }
    const player = state.getActivePlayer()!;
    if (state.getPlayers().getScore().get(player.getIndex()) < TowerCapability.RANSOM_POINTS) {
      throw new Error("Not enough points to pay ransom.");
    }
    const model = state.getCapabilityModel<Arr<List<Follower>>>(TOWER_CLS)!;
    let follower: Follower | null = null;
    let jailer: Player | null = null;
    for (let i = 0; i < model.length(); i++) {
      const f = model.get(i).find((x) => x.getId() === this.meepleId).getOrNull();
      if (f !== null) {
        follower = f;
        jailer = state.getPlayers().getPlayer(i);
        break;
      }
    }
    if (follower === null) {
      throw new Error(`No such prisoner ${this.meepleId}.`);
    }
    if (!follower.getPlayer().equals(player)) {
      throw new Error("Cannot pay ransom for opponent's follower.");
    }
    const jailerF = jailer!;
    const followerF = follower;
    state = state.mapCapabilityModel<Arr<List<Follower>>>(TOWER_CLS, (m) =>
      m.update(jailerF.getIndex(), m.get(jailerF.getIndex()).remove(followerF) as List<Follower>) as Arr<
        List<Follower>
      >,
    );
    state = state.addFlag(Flag.RANSOM_PAID);
    let points: List<ReceivedPoints> = List.empty<ReceivedPoints>();
    points = points.append(
      new ReceivedPoints(
        new PointsExpression(
          "ransompaid.payment",
          new ExprItem(1, "meeples", -1 * TowerCapability.RANSOM_POINTS),
        ),
        player,
        null,
      ),
    ) as List<ReceivedPoints>;
    points = points.append(
      new ReceivedPoints(
        new PointsExpression("ransompaid.income", new ExprItem(1, "meeples", TowerCapability.RANSOM_POINTS)),
        jailerF,
        null,
      ),
    ) as List<ReceivedPoints>;
    state = new AddPoints(points, false).apply(state);
    state = state.appendEvent(
      new RansomPaidEvent(PlayEventMeta.createWithActivePlayer(state), followerF, jailerF),
    );
    return state;
  }
}
