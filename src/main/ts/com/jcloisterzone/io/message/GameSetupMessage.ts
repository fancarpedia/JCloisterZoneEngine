import { AbstractMessage } from "./AbstractMessage.js";
import type { Message } from "./Message.js";

/** GAME_SETUP — the first message; describes the game configuration. Populated
 *  from the .jcz `setup` block by the MessageParser. */
export class GameSetupMessage extends AbstractMessage implements Message {
  static readonly command = "GAME_SETUP";

  // plain-JSON fields (set by the parser); converted to Vavr collections by GameStateBuilder.
  sets: Record<string, number> = {};
  elements: Record<string, unknown> = {};
  rules: Record<string, unknown> = {};
  timer: Record<string, unknown> | null = null;
  players = 0;
  start: GameSetupMessage.PlacedTileItem[] = [];
  gameAnnotations: Record<string, unknown> = {};
  initialRandom = 0;

  getSets(): Record<string, number> {
    return this.sets;
  }
  getElements(): Record<string, unknown> {
    return this.elements;
  }
  getRules(): Record<string, unknown> {
    return this.rules;
  }
  getTimer(): Record<string, unknown> | null {
    return this.timer;
  }
  getPlayers(): number {
    return this.players;
  }
  getStart(): GameSetupMessage.PlacedTileItem[] {
    return this.start;
  }
  getGameAnnotations(): Record<string, unknown> {
    return this.gameAnnotations;
  }
  getInitialRandom(): number {
    return this.initialRandom;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GameSetupMessage {
  /** A start tile to pre-place on the board. */
  export class PlacedTileItem {
    tile = "";
    x = 0;
    y = 0;
    rotation = 0;

    getTile(): string {
      return this.tile;
    }
    getX(): number {
      return this.x;
    }
    getY(): number {
      return this.y;
    }
    getRotation(): number {
      return this.rotation;
    }
  }
}
