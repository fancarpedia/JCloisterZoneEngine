import { Valued } from "../../io/vavr/equality.js";
import { Predicates } from "../../io/vavr/Predicates.js";
import { Seq } from "../../io/vavr/Seq.js";
import { Stream, Vector } from "../../io/vavr/SeqTypes.js";
import { type ClassToken, isAssignableFrom } from "../../lang/Class.js";
import { Follower } from "./figure/Follower.js";
import type { Meeple } from "./figure/Meeple.js";
import type { Special } from "./figure/Special.js";
import type { GameState } from "./game/state/GameState.js";

/** Represents a player (identified by index). */
export class Player implements Valued {
  private readonly index: number;

  constructor(index: number) {
    this.index = index;
  }

  getIndex(): number {
    return this.index;
  }

  hashCode(): number {
    return this.index;
  }

  equals(o: unknown): boolean {
    if (this === o) return true;
    if (o instanceof Player) {
      return this.index === o.index;
    }
    return false;
  }

  getNextPlayer(state: GameState): Player {
    const nextPlayerIndex = (this.index + 1) % state.getPlayers().length();
    return state.getPlayers().getPlayer(nextPlayerIndex);
  }

  getPrevPlayer(state: GameState): Player {
    // % on negative numbers is negative in JS too — avoid it for prev player
    const prevPlayerIndex = this.index === 0 ? state.getPlayers().length() - 1 : this.index - 1;
    return state.getPlayers().getPlayer(prevPlayerIndex);
  }

  getFollowers(state: GameState): Seq<Follower> {
    return state.getPlayers().getFollowers().get(this.index);
  }

  getSpecialMeeples(state: GameState): Seq<Special> {
    return state.getPlayers().getSpecialMeeples().get(this.index);
  }

  getMeeples(state: GameState): Stream<Meeple> {
    return Stream.concat<Meeple>(this.getFollowers(state), this.getSpecialMeeples(state)) as Stream<Meeple>;
  }

  getMeepleFromSupply(state: GameState, clazz: ClassToken<Meeple>): Meeple | null;
  getMeepleFromSupply(state: GameState, meepleId: string): Meeple | null;
  getMeepleFromSupply(state: GameState, arg: ClassToken<Meeple> | string): Meeple | null {
    if (typeof arg === "string") {
      return Stream.ofAll(this.getMeeples(state))
        .find((m) => m.getId() === arg)
        .filter((m) => m.isInSupply(state))
        .getOrNull();
    }
    const collection: Seq<Meeple> = isAssignableFrom(Follower, arg)
      ? (this.getFollowers(state) as Seq<Meeple>)
      : (this.getSpecialMeeples(state) as Seq<Meeple>);
    return Stream.ofAll(collection)
      .filter((m) => m.constructor === arg)
      .find((m) => m.isInSupply(state))
      .getOrNull();
  }

  getMeeplesFromSupply(state: GameState, meepleTypes: Vector<ClassToken<Meeple>>): Vector<Meeple> {
    return meepleTypes
      .map((cls) => this.getMeepleFromSupply(state, cls) as Meeple)
      .filter(Predicates.isNotNull()) as Vector<Meeple>;
  }

  toString(): string {
    return "Player " + this.index;
  }
}
