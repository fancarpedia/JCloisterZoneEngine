import type { Map as VMap } from "../../../../io/vavr/Map.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import type { ClassToken } from "../../../../lang/Class.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import { Position } from "../../board/Position.js";
import { GoldPieceAction } from "../../action/GoldPieceAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import { TokenPlacedEvent } from "../../event/TokenPlacedEvent.js";
import type { PlaceTokenMessage } from "../../io/message/PlaceTokenMessage.js";
import { PlaceTokenMessage as PlaceTokenMessageClass } from "../../io/message/PlaceTokenMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import type { Capability } from "../Capability.js";
import { GoldminesCapability, type GoldModel } from "../capability/GoldminesCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const GOLD_CLS = GoldminesCapability as unknown as ClassToken<Capability<GoldModel>>;

/** After a goldmine tile is placed, a gold piece is dropped on it plus a second on
 *  an adjacent tile (chosen by the player when there is more than one option). */
export class GoldPiecePhase extends Phase {
  static readonly simpleName = "GoldPiecePhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  private placeGoldToken(state: GameState, pos: Position): GameState {
    state = state.mapCapabilityModel<GoldModel>(GOLD_CLS, (placedGold: VMap<Position, number>) =>
      placedGold.put(pos, placedGold.get(pos).getOrElse(0) + 1),
    );
    return state.appendEvent(
      new TokenPlacedEvent(
        PlayEventMeta.createWithoutPlayer(),
        GoldminesCapability.GoldToken.GOLD,
        pos as unknown as BoardPointer,
      ),
    );
  }

  enter(state: GameState): StepResult {
    const placedTile = state.getLastPlaced()!;
    if (placedTile.getTile().hasModifier(GoldminesCapability.GOLDMINE)) {
      const pos = placedTile.getPosition();
      state = this.placeGoldToken(state, pos);
      const options: Position[] = state
        .getAdjacentAndDiagonalTiles(pos)
        .map((pt) => pt.getPosition())
        .toArray();
      if (options.length === 1) {
        state = this.placeGoldToken(state, options[0]);
      } else if (options.length > 1) {
        const set: Set<Position> = HashSet.ofAll(options);
        const action = new GoldPieceAction(set);
        return this.promote(
          state.setPlayerActions(
            new ActionsState(state.getTurnPlayer()!, action as unknown as PlayerAction<unknown>, false),
          ),
        );
      }
    }
    return this.next(state);
  }

  handlePlaceToken(state: GameState, msg: PlaceTokenMessage): StepResult {
    if (msg.getToken() !== GoldminesCapability.GoldToken.GOLD) {
      throw new Error("Illegal gold token");
    }
    state = this.placeGoldToken(state, msg.getPointer() as Position);
    state = this.clearActions(state);
    return this.next(state);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(PlaceTokenMessageClass, this.handlePlaceToken);
    return m;
  }
}
