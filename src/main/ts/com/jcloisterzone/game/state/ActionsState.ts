import type { Seq } from "../../../../io/vavr/Seq.js";
import { Vector } from "../../../../io/vavr/SeqTypes.js";
import type { Player } from "../../Player.js";
import { MeepleAction } from "../../action/MeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { Phantom } from "../../figure/Phantom.js";

type AnyAction = PlayerAction<unknown>;

/** All the sets of options a player can choose from in a given turn. */
export class ActionsState {
  private readonly player: Player;
  private readonly actions: Vector<AnyAction>;
  private readonly passAllowed: boolean;

  constructor(player: Player, actions: Vector<AnyAction>, passAllowed: boolean);
  constructor(player: Player, action: AnyAction, passAllowed: boolean);
  constructor(player: Player, actions: Vector<AnyAction> | AnyAction, passAllowed: boolean) {
    this.player = player;
    this.actions = actions instanceof Vector ? actions : Vector.of(actions);
    this.passAllowed = passAllowed;
  }

  setActions(actions: Vector<AnyAction>): ActionsState {
    if (this.actions === actions) return this;
    return new ActionsState(this.player, actions, this.passAllowed);
  }

  appendAction(action: AnyAction): ActionsState {
    return this.setActions(this.actions.append(action) as Vector<AnyAction>);
  }

  appendActions(actions: Iterable<AnyAction>): ActionsState {
    return this.setActions(this.actions.appendAll(actions) as Vector<AnyAction>);
  }

  /** Aggregate MeepleActions by meeple type, merging options. */
  mergeMeepleActions(): ActionsState {
    const grouped: Seq<Seq<MeepleAction>> = this.actions
      .filter((a) => a instanceof MeepleAction)
      .map((a) => a as MeepleAction)
      .groupBy((a) => a.getMeepleType())
      .values();

    if (grouped.find((v) => v.length() > 1).isEmpty()) {
      return this; // nothing to merge
    }

    let actions: Vector<AnyAction> = Vector.ofAll(
      grouped.map((v) => v.reduce((x, y) => x.merge(y))),
    );
    actions = actions.appendAll(
      this.actions.filter((a) => !(a instanceof MeepleAction)),
    ) as Vector<AnyAction>;
    return this.setActions(actions);
  }

  /** Reorder actions to logical order (Phantom at the end). */
  reorderActions(): ActionsState {
    const actions = this.actions
      .partition(
        (a) => !(a instanceof MeepleAction) || (a as MeepleAction).getMeepleType() !== Phantom,
      )
      .apply((nonPhantom, phantom) => nonPhantom.appendAll(phantom)) as Vector<AnyAction>;
    return this.setActions(actions);
  }

  getPlayer(): Player {
    return this.player;
  }

  getActions(): Vector<AnyAction> {
    return this.actions;
  }

  isPassAllowed(): boolean {
    return this.passAllowed;
  }
}
