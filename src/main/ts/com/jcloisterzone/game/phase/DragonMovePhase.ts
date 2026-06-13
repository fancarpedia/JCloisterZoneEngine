import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { Vector } from "../../../../io/vavr/SeqTypes.js";
import type { ClassToken } from "../../../../lang/Class.js";
import { Position } from "../../board/Position.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { MoveDragonAction } from "../../action/MoveDragonAction.js";
import { Dragon } from "../../figure/neutral/Dragon.js";
import type { NeutralFigure } from "../../figure/neutral/NeutralFigure.js";
import type { MoveNeutralFigureMessage } from "../../io/message/MoveNeutralFigureMessage.js";
import { MoveNeutralFigureMessage as MoveNeutralFigureMessageClass } from "../../io/message/MoveNeutralFigureMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { MoveNeutralFigure } from "../../reducers/MoveNeutralFigure.js";
import { UndeployMeeple } from "../../reducers/UndeployMeeple.js";
import type { Capability } from "../Capability.js";
import { CountCapability } from "../capability/CountCapability.js";
import { DragonCapability } from "../capability/DragonCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import { Flag } from "../state/Flag.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const DRAGON_CLS = DragonCapability as unknown as ClassToken<Capability<Vector<Position>>>;

/** The Dragon walks up to 6 tiles, players choosing each step in turn order; meeples it lands
 *  on (that can be eaten) are returned. */
export class DragonMovePhase extends Phase {
  static readonly simpleName = "DragonMovePhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  private getVisitedPositions(state: GameState): Vector<Position> {
    const visited = state.getCapabilityModel<Vector<Position>>(DRAGON_CLS);
    return visited === null ? Vector.empty<Position>() : visited;
  }

  enter(state: GameState): StepResult {
    const visited = this.getVisitedPositions(state);

    state = state.addFlag(Flag.POST_WOOD_ACTION_STARTED);

    if (visited.size() === DragonCapability.DRAGON_MOVES) {
      return this.next(this.endDragonMove(state));
    }

    const availMoves = this.getAvailDragonMoves(state, visited);
    if (availMoves.isEmpty()) {
      return this.next(this.endDragonMove(state));
    }

    const dragon = state.getNeutralFigures().getDragon()!;
    const turnPlayer = state.getTurnPlayer()!;
    const players = state.getPlayers();
    const p = players.getPlayer((turnPlayer.getIndex() + visited.length()) % players.getPlayers().length());

    return this.promote(
      state.setPlayerActions(new ActionsState(p, new MoveDragonAction(dragon.getId(), availMoves), false)),
    );
  }

  private endDragonMove(state: GameState): GameState {
    state = state.setCapabilityModel<Vector<Position>>(DRAGON_CLS, Vector.empty<Position>());
    state = this.clearActions(state);
    return state;
  }

  getAvailDragonMoves(state: GameState, visited: Vector<Position>): Set<Position> {
    let result: Set<Position> = HashSet.empty<Position>();
    const fairyPtr = state.getNeutralFigures().getFairyDeployment();
    const fairyPosition = fairyPtr === null ? null : fairyPtr.getPosition();
    const dragonPosition = state.getNeutralFigures().getDragonDeployment()!;

    for (const offset of Position.ADJACENT.values()) {
      const pos = dragonPosition.add(offset);
      const pt = state.getPlacedTile(pos);
      if (pt === null || CountCapability.isTileForbidden(pt.getTile())) continue;
      if (visited.contains(pos)) continue;
      if (fairyPosition !== null && pos.equals(fairyPosition)) continue;
      result = result.add(pos);
    }
    return result;
  }

  handleMoveNeutralFigure(state: GameState, msg: MoveNeutralFigureMessage): StepResult {
    const ptr = msg.getTo()!;
    const fig = state.getNeutralFigures().getById(msg.getFigureId()!);
    if (!(fig instanceof Dragon)) {
      throw new Error("Illegal neutral figure move");
    }

    const visited = this.getVisitedPositions(state);
    const availMoves = this.getAvailDragonMoves(state, visited);
    const pos = ptr.getPosition();
    if (!availMoves.contains(pos)) {
      throw new Error("Invalid dragon move.");
    }

    const dragonPosition = state.getNeutralFigures().getDragonDeployment()!;
    state = new MoveNeutralFigure(
      fig as unknown as NeutralFigure<BoardPointer>,
      pos as unknown as BoardPointer,
      state.getActivePlayer(),
    ).apply(state);
    state = state.mapCapabilityModel<Vector<Position>>(
      DRAGON_CLS,
      (moves) => moves.append(dragonPosition) as Vector<Position>,
    );

    for (const t of state.getDeployedMeeples()) {
      const m = t._1;
      const fp = t._2;
      if (pos.equals(fp.getPosition()) && m.canBeEatenByDragon(state)) {
        state = new UndeployMeeple(m, true).apply(state);
      }
    }

    return this.enter(state);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(MoveNeutralFigureMessageClass, this.handleMoveNeutralFigure);
    return m;
  }
}
