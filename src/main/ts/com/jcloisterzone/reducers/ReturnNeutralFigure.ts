import type { Player } from "../Player.js";
import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import { NeutralFigureReturned } from "../event/NeutralFigureReturned.js";
import { PlayEventMeta } from "../event/PlayEvent.js";
import type { NeutralFigure } from "../figure/neutral/NeutralFigure.js";
import type { GameState } from "../game/state/GameState.js";
import type { Reducer } from "./Reducer.js";

/** Removes a neutral figure from the board and emits a NeutralFigureReturned event. */
export class ReturnNeutralFigure implements Reducer {
  constructor(
    private readonly figure: NeutralFigure<BoardPointer>,
    private readonly triggeringPlayer: Player | null = null,
  ) {}

  apply(state: GameState): GameState {
    let nfState = state.getNeutralFigures();
    const deployed = nfState.getDeployedNeutralFigures();
    const from = deployed.get(this.figure).getOrNull();
    nfState = nfState.setDeployedNeutralFigures(deployed.remove(this.figure) as typeof deployed);
    state = state.setNeutralFigures(nfState);
    state = state.appendEvent(
      new NeutralFigureReturned(PlayEventMeta.createWithPlayer(this.triggeringPlayer), this.figure, from),
    );
    return state;
  }
}
