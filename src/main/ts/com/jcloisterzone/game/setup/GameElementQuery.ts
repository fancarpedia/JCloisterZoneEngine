import type { GameState } from "../state/GameState.js";
import type { SetupQuery } from "./SetupQuery.js";

/** True when the named game element is enabled in setup. */
export class GameElementQuery implements SetupQuery {
  constructor(private readonly gameElement: string) {}

  apply(gameState: GameState): boolean {
    return gameState.getElements().containsKey(this.gameElement);
  }
}
