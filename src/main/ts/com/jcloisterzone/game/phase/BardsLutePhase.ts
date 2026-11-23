import { HashSet } from "../../../../io/vavr/Set.js";
import type { BoardPointer } from "../../board/pointer/BoardPointer.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { BardsLuteAction } from "../../action/BardsLuteAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { PlacementCause } from "../../event/PlacementCause.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import { TokenPlacedEvent } from "../../event/TokenPlacedEvent.js";
import type { PlaceTokenMessage } from "../../io/message/PlaceTokenMessage.js";
import { PlaceTokenMessage as PlaceTokenMessageClass } from "../../io/message/PlaceTokenMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { BardsLuteCapability, type BardsLuteModel } from "../capability/BardsLuteCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import { Flag } from "../state/Flag.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

/** After a lute tile is placed, before any meeple: the player puts a Bards' note on one free
 *  city / road / field of that tile (mandatory — the tile could only be placed with a free one). */
export class BardsLutePhase extends Phase {
  static readonly simpleName = "BardsLutePhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    const placed = state.getLastPlaced();
    if (placed === null || !placed.getTile().hasModifier(BardsLuteCapability.BARDS_LUTE)) {
      return this.next(state);
    }
    const options = BardsLuteCapability.noteOptions(state, placed.getPosition());
    if (options.length === 0) {
      // nothing free (e.g. a meeple got there first some other way) — no note this time
      return this.next(state);
    }
    const action = new BardsLuteAction(HashSet.ofAll(options), BardsLuteCapability.BardsLuteToken.BARDS_NOTE);
    return this.promote(
      state.setPlayerActions(new ActionsState(state.getTurnPlayer()!, action as unknown as PlayerAction<unknown>, false)),
    );
  }

  handlePlaceToken(state: GameState, msg: PlaceTokenMessage): StepResult {
    if (msg.getToken() !== BardsLuteCapability.BardsLuteToken.BARDS_NOTE) {
      throw new Error("Illegal Bards' note token");
    }
    const fp = msg.getPointer() as FeaturePointer;
    const placed = state.getLastPlaced()!;
    const allowed = BardsLuteCapability.noteOptions(state, placed.getPosition());
    if (!allowed.some((o) => o.equals(fp))) {
      throw new Error("Invalid Bards' note placement");
    }
    state = state.mapCapabilityModel<BardsLuteModel>(BardsLuteCapability as never, (notes) => notes.add(fp));
    state = state.appendEvent(
      new TokenPlacedEvent(
        PlayEventMeta.createWithActivePlayer(state),
        BardsLuteCapability.BardsLuteToken.BARDS_NOTE,
        fp as unknown as BoardPointer,
        PlacementCause.tilePlaced(placed.getPosition()),
      ),
    );
    // the note lies on a feature of the tile as it lies, so the tile may no longer be turned
    state = state.addFlag(Flag.TILE_ROTATION_DISALLOWED);
    state = this.clearActions(state);
    return this.next(state);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(PlaceTokenMessageClass, this.handlePlaceToken);
    return m;
  }
}
