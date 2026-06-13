import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { Vector } from "../../../../io/vavr/SeqTypes.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { NeutralFigureAction } from "../../action/NeutralFigureAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { RemoveMageOrWitchAction } from "../../action/RemoveMageOrWitchAction.js";
import { City } from "../../feature/City.js";
import type { Completable } from "../../feature/Completable.js";
import type { Feature } from "../../feature/Feature.js";
import { Road } from "../../feature/Road.js";
import { Mage } from "../../figure/neutral/Mage.js";
import type { NeutralFigure } from "../../figure/neutral/NeutralFigure.js";
import { Witch } from "../../figure/neutral/Witch.js";
import type { MoveNeutralFigureMessage } from "../../io/message/MoveNeutralFigureMessage.js";
import { MoveNeutralFigureMessage as MoveNeutralFigureMessageClass } from "../../io/message/MoveNeutralFigureMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { MoveNeutralFigure } from "../../reducers/MoveNeutralFigure.js";
import { MageAndWitchCapability } from "../capability/MageAndWitchCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

/** After a tile with a mage-trigger is placed (or the mage and witch end up on the
 *  same feature), the player moves the mage and witch onto open roads/cities. */
export class MageAndWitchPhase extends Phase {
  static readonly simpleName = "MageAndWitchPhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    const tile = state.getLastPlaced()!.getTile();
    const ns = state.getNeutralFigures();
    const mage = ns.getMage()!;
    const witch = ns.getWitch()!;
    const mageFeature = mage.getFeature(state) as Completable | null;
    const witchFeature = witch.getFeature(state) as Completable | null;
    const sameFeature = mageFeature !== null && mageFeature === witchFeature;

    if (!tile.hasModifier(MageAndWitchCapability.MAGE_TRIGGER) && !sameFeature) {
      return this.next(state);
    }

    const targets: Completable[] = [];
    for (const f of state.getFeatures()) {
      if (!(f instanceof City || f instanceof Road)) continue;
      if (f === (mageFeature as unknown as Feature) || f === (witchFeature as unknown as Feature)) continue;
      if (!(f as unknown as Completable).isOpen(state)) continue;
      targets.push(f as unknown as Completable);
    }

    if (targets.length === 0) {
      // can't move either → must remove one if both are on the board
      if (mageFeature !== null && witchFeature !== null) {
        const action = new RemoveMageOrWitchAction(
          HashSet.of(mage as NeutralFigure<FeaturePointer>, witch as NeutralFigure<FeaturePointer>),
        );
        return this.promote(
          state.setPlayerActions(new ActionsState(state.getTurnPlayer()!, action as unknown as PlayerAction<unknown>, false)),
        );
      }
      if (mageFeature !== null) state = new MoveNeutralFigure(mage as NeutralFigure<BoardPointer>, null).apply(state);
      if (witchFeature !== null) state = new MoveNeutralFigure(witch as NeutralFigure<BoardPointer>, null).apply(state);
      return this.next(state);
    }

    const fps: FeaturePointer[] = [];
    for (const f of targets) for (const fp of f.getPlaces()) fps.push(fp);
    const options: Set<FeaturePointer> = HashSet.ofAll(fps);

    const actions = Vector.of(
      new NeutralFigureAction(mage as NeutralFigure<FeaturePointer>, options) as unknown as PlayerAction<unknown>,
      new NeutralFigureAction(witch as NeutralFigure<FeaturePointer>, options) as unknown as PlayerAction<unknown>,
    );
    return this.promote(state.setPlayerActions(new ActionsState(state.getTurnPlayer()!, actions, false)));
  }

  handleMoveNeutralFigure(state: GameState, msg: MoveNeutralFigureMessage): StepResult {
    const ptr = msg.getTo() as FeaturePointer | null;
    const fig = state.getNeutralFigures().getById(msg.getFigureId()!);
    if (fig instanceof Mage || fig instanceof Witch) {
      state = new MoveNeutralFigure(fig as NeutralFigure<BoardPointer>, ptr, state.getActivePlayer()).apply(state);
      state = this.clearActions(state);
      return this.next(state);
    }
    throw new Error("Illegal neutral figure move");
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(MoveNeutralFigureMessageClass, this.handleMoveNeutralFigure);
    return m;
  }
}
