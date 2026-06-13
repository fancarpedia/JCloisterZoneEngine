import type { Map as VMap } from "../../../../io/vavr/Map.js";
import type { Seq } from "../../../../io/vavr/Seq.js";
import { List } from "../../../../io/vavr/SeqTypes.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { MeeplePointer } from "../../board/pointer/MeeplePointer.js";
import { ExprItem } from "../../event/ExprItem.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import { PointsExpression } from "../../event/PointsExpression.js";
import { ReceivedPoints } from "../../event/ScoreEvent.js";
import { TokenPlacedEvent } from "../../event/TokenPlacedEvent.js";
import { Field } from "../../feature/Field.js";
import type { Meeple } from "../../figure/Meeple.js";
import { Shepherd } from "../../figure/Shepherd.js";
import { FlockAction } from "../../action/FlockAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { FlockMessage } from "../../io/message/FlockMessage.js";
import { AddPoints } from "../../reducers/AddPoints.js";
import { UndeployMeeple } from "../../reducers/UndeployMeeple.js";
import { SheepCapability } from "../capability/SheepCapability.js";
import { SheepToken } from "../capability/SheepToken.js";
import { ActionsState } from "../state/ActionsState.js";
import { Flag } from "../state/Flag.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

/** Resolves shepherd flocks after a tile placement (Hills & Sheep). */
export class ShepherdPhase extends Phase {
  static readonly simpleName = "ShepherdPhase";

  private getClosedFieldsWithShepherd(state: GameState): Seq<Field> {
    return state
      .getDeployedMeeples()
      .filterKeys((m) => m instanceof Shepherd)
      .values()
      .map((fp) => state.getFeature(fp) as Field)
      .distinct()
      .filter((f) => !f.isOpen(state)) as Seq<Field>;
  }

  enter(state: GameState): StepResult {
    const lastPlaced = state.getLastPlaced()!;
    const shepherds = state
      .getTurnPlayer()!
      .getSpecialMeeples(state)
      .filter((m) => m instanceof Shepherd)
      .map((m) => m as Shepherd);

    let unresolvedFlocks: List<MeeplePointer> = List.empty<MeeplePointer>();
    const unresolvedFields: Field[] = [];

    for (const shepherd of shepherds) {
      const shepherdFp = shepherd.getDeployment(state);
      let alreadyExpanded = false;
      if (shepherdFp !== null) {
        const isJustPlaced = lastPlaced.getPosition().equals(shepherdFp.getPosition());
        const field = state.getFeature(shepherdFp) as Field;
        const isFieldExtended = state
          .getTileFeatures2(lastPlaced.getPosition())
          .map((t) => t._2)
          .contains(field);

        if (isJustPlaced) {
          state = this.expandFlock(state, shepherdFp);
          alreadyExpanded = true;
        }
        if (!alreadyExpanded && isFieldExtended && !unresolvedFields.includes(field)) {
          unresolvedFlocks = unresolvedFlocks.append(
            new MeeplePointer(shepherdFp, shepherd.getId()),
          ) as List<MeeplePointer>;
          unresolvedFields.push(field);
        }
      }
    }

    for (const field of this.getClosedFieldsWithShepherd(state)) {
      if (!unresolvedFields.includes(field)) {
        state = this.scoreFlockField(state, field);
      }
    }

    if (unresolvedFlocks.isEmpty()) {
      return this.next(state);
    }

    const cap = state.getCapabilities().get(SheepCapability)!;
    const _unresolved = unresolvedFlocks;
    state = cap.updateModel(state, (model) => model.setUnresolvedFlocks(_unresolved));
    return this.prepareAction(state);
  }

  handleFlockMessage(state: GameState, msg: FlockMessage): StepResult {
    const cap = state.getCapabilities().get(SheepCapability)!;
    const unresolvedFlocks = cap.getModel(state).getUnresolvedFlocks();

    state = state.addFlag(Flag.POST_WOOD_ACTION_STARTED);

    const mp = unresolvedFlocks.head();
    const shepherdFp = mp.asFeaturePointer();

    if (msg.getValue() === FlockMessage.FlockOption.EXPAND) {
      state = this.expandFlock(state, shepherdFp);
      for (const field of this.getClosedFieldsWithShepherd(state)) {
        state = this.scoreFlockField(state, field);
      }
    } else {
      state = this.scoreFlockFp(state, shepherdFp);
    }

    state = cap.updateModel(state, (model) =>
      model.setUnresolvedFlocks(unresolvedFlocks.tail() as List<MeeplePointer>),
    );
    return this.prepareAction(state);
  }

  private prepareAction(state: GameState): StepResult {
    const cap = state.getCapabilities().get(SheepCapability)!;
    const unresolvedFlocks = cap.getModel(state).getUnresolvedFlocks();
    if (unresolvedFlocks.isEmpty()) {
      return this.next(state);
    }
    const action = new FlockAction(unresolvedFlocks.head());
    const as = new ActionsState(
      state.getTurnPlayer()!,
      action as unknown as PlayerAction<unknown>,
      false,
    );
    return this.promote(state.setPlayerActions(as));
  }

  private getShepherdsOnField(state: GameState, field: Field): VMap<Meeple, FeaturePointer> {
    return state
      .getDeployedMeeples()
      .filter((m, fp) => m instanceof Shepherd && field.getPlaces().contains(fp));
  }

  private scoreFlockFp(state: GameState, shepherdFp: FeaturePointer): GameState {
    const field = state.getFeature(shepherdFp) as Field;
    state = this.scoreFlockField(state, field);
    for (const closedField of this.getClosedFieldsWithShepherd(state)) {
      state = this.scoreFlockField(state, closedField);
    }
    return this.clearActions(state);
  }

  private scoreFlockField(state: GameState, field: Field): GameState {
    const cap = state.getCapabilities().get(SheepCapability)!;
    const model = cap.getModel(state);
    const placedTokens = model.getPlacedTokens();
    const shepherdsOnField = this.getShepherdsOnField(state, field);
    const tokens = shepherdsOnField
      .values()
      .flatMap((fp) => placedTokens.get(fp).get()) as Seq<SheepToken>;

    const grouped = [...tokens.groupBy((t) => t)].sort((a, b) => a._1.ordinal() - b._1.ordinal());
    const exprItems = grouped.map((t) => {
      const size = t._2.size();
      return new ExprItem(size, "sheep." + t._1.name(), t._1.sheepCount() * size);
    });
    const expr = new PointsExpression("flock", List.ofAll(exprItems));

    let receivedPoints: List<ReceivedPoints> = List.empty<ReceivedPoints>();
    const scoredIdx = new Set<number>();
    for (const t of shepherdsOnField) {
      const shepherd = (t as Tuple2<Meeple, FeaturePointer>)._1 as Shepherd;
      const player = shepherd.getPlayer();
      if (!scoredIdx.has(player.getIndex())) {
        receivedPoints = receivedPoints.append(
          new ReceivedPoints(expr, player, shepherd.getDeployment(state)),
        ) as List<ReceivedPoints>;
        scoredIdx.add(player.getIndex());
      }
      state = new UndeployMeeple(shepherd, false).apply(state);
    }
    state = new AddPoints(receivedPoints, false).apply(state);

    let newPlaced = placedTokens;
    for (const fp of shepherdsOnField.values()) newPlaced = newPlaced.remove(fp);
    return cap.setModel(state, model.setPlacedTokens(newPlaced));
  }

  private expandFlock(state: GameState, shepherdFp: FeaturePointer): GameState {
    const drawnToken = this.drawTokenFromBag(state);
    state = state.appendEvent(
      new TokenPlacedEvent(PlayEventMeta.createWithoutPlayer(), drawnToken, shepherdFp),
    );
    const cap = state.getCapabilities().get(SheepCapability)!;

    if (drawnToken === SheepToken.WOLF) {
      const field = state.getFeature(shepherdFp) as Field;
      const shepherdsOnField = this.getShepherdsOnField(state, field);
      for (const m of shepherdsOnField.keySet()) {
        state = new UndeployMeeple(m, true).apply(state);
      }
      state = cap.updateModel(state, (model) => {
        let placedTokens = model.getPlacedTokens();
        for (const fp of shepherdsOnField.values()) placedTokens = placedTokens.remove(fp);
        return model.setPlacedTokens(placedTokens);
      });
      return state;
    }

    return cap.updateModel(state, (model) => {
      const placedTokens = model.getPlacedTokens();
      const existing = placedTokens.get(shepherdFp).getOrElse(List.empty<SheepToken>());
      return model.setPlacedTokens(
        placedTokens.put(shepherdFp, (existing as List<SheepToken>).append(drawnToken) as List<SheepToken>),
      );
    });
  }

  private drawTokenFromBag(state: GameState): SheepToken {
    const bag = state.getCapabilities().get(SheepCapability)!.getBagConent(state);
    return bag.get(this.getRandom().getNextInt(bag.size()));
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(FlockMessage, this.handleFlockMessage);
    return m;
  }
}
