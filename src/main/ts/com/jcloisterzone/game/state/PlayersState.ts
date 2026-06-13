import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { Option } from "../../../../io/vavr/Option.js";
import type { Seq } from "../../../../io/vavr/Seq.js";
import { Arr } from "../../../../io/vavr/SeqTypes.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import type { Player } from "../../Player.js";
import type { Follower } from "../../figure/Follower.js";
import type { Special } from "../../figure/Special.js";
import type { Token } from "../Token.js";

type TokenMap = VMap<Token, number>;

/** Immutable state of all players (scores, tokens, supplies, turn). */
export class PlayersState {
  private readonly players: Arr<Player>;
  private readonly score: Arr<number>;
  private readonly tokens: Arr<TokenMap>;
  private readonly turnPlayerIndex: number | null;
  private readonly followers: Arr<Seq<Follower>>;
  private readonly specialMeeples: Arr<Seq<Special>>;

  constructor(
    players: Arr<Player>,
    score: Arr<number>,
    tokens: Arr<TokenMap>,
    turnPlayerIndex: number | null,
    followers: Arr<Seq<Follower>>,
    specialMeeples: Arr<Seq<Special>>,
  ) {
    this.players = players;
    this.score = score;
    this.tokens = tokens;
    this.turnPlayerIndex = turnPlayerIndex;
    this.followers = followers;
    this.specialMeeples = specialMeeples;
  }

  static createInitial(players: Arr<Player>, turnPlayerIndex: number | null): PlayersState {
    const nullSeq = null as unknown as Arr<Seq<Follower>>;
    return new PlayersState(
      players,
      players.map(() => 0) as unknown as Arr<number>,
      players.map(() => HashMap.empty<Token, number>()) as unknown as Arr<TokenMap>,
      turnPlayerIndex,
      nullSeq,
      nullSeq as unknown as Arr<Seq<Special>>,
    );
  }

  setScore(score: Arr<number>): PlayersState {
    if (this.score === score) return this;
    return new PlayersState(this.players, score, this.tokens, this.turnPlayerIndex, this.followers, this.specialMeeples);
  }

  setTokens(tokens: Arr<TokenMap>): PlayersState {
    if (this.tokens === tokens) return this;
    return new PlayersState(this.players, this.score, tokens, this.turnPlayerIndex, this.followers, this.specialMeeples);
  }

  setTokenCount(index: number, token: Token, count: number): PlayersState {
    if (count < 0) {
      throw new Error(`Token ${token} count can't be ${count}`);
    }
    const playerTokens = this.tokens.get(index);
    if (playerTokens.get(token).getOrElse(0) === count) {
      return this;
    }
    if (count === 0) {
      return this.setTokens(this.tokens.update(index, playerTokens.remove(token)) as Arr<TokenMap>);
    }
    return this.setTokens(this.tokens.update(index, playerTokens.put(token, count)) as Arr<TokenMap>);
  }

  setTokenCountForAllPlayers(token: Token, count: number): PlayersState {
    let ps: PlayersState = this;
    for (const p of this.getPlayers()) {
      ps = ps.setTokenCount(p.getIndex(), token, count);
    }
    return ps;
  }

  addTokenCount(index: number, token: Token, count: number): PlayersState {
    if (count === 0) return this;
    const newValue = this.getPlayerTokenCount(index, token) + count;
    return this.setTokenCount(index, token, newValue);
  }

  setTurnPlayerIndex(turnPlayerIndex: number | null): PlayersState {
    if (this.turnPlayerIndex === turnPlayerIndex) return this;
    return new PlayersState(this.players, this.score, this.tokens, turnPlayerIndex, this.followers, this.specialMeeples);
  }

  setFollowers(followers: Arr<Seq<Follower>>): PlayersState {
    if (this.followers === followers) return this;
    return new PlayersState(this.players, this.score, this.tokens, this.turnPlayerIndex, followers, this.specialMeeples);
  }

  setSpecialMeeples(specialMeeples: Arr<Seq<Special>>): PlayersState {
    if (this.specialMeeples === specialMeeples) return this;
    return new PlayersState(this.players, this.score, this.tokens, this.turnPlayerIndex, this.followers, specialMeeples);
  }

  getPlayers(): Arr<Player> {
    return this.players;
  }

  getPlayersBeginWith(p: Player): Arr<Player> {
    return this.players
      .slice(p.getIndex(), this.players.length())
      .appendAll(this.players.slice(0, p.getIndex())) as Arr<Player>;
  }

  getPlayer(idx: number): Player {
    return this.players.get(idx);
  }

  length(): number {
    return this.players.length();
  }

  getScore(): Arr<number> {
    return this.score;
  }

  getTokens(): Arr<TokenMap> {
    return this.tokens;
  }

  getPlayerTokenCount(index: number, token: Token): number {
    return this.tokens.get(index).get(token).getOrElse(0);
  }

  getPlayerWithToken(token: Token): Player | null {
    const playersCount = this.players.length();
    for (let i = 0; i < playersCount; i++) {
      if (this.tokens.get(i).get(token).getOrElse(0) > 0) {
        return this.players.get(i);
      }
    }
    return null;
  }

  getPlayersWithToken(token: Token): Set<Player> {
    const seq = this.players
      .zip(this.tokens)
      .filter((t) => t._2.get(token).getOrElse(0) > 0)
      .map((t) => t._1);
    return HashSet.ofAll(seq);
  }

  getTurnPlayerIndex(): number | null {
    return this.turnPlayerIndex;
  }

  getFollowers(): Arr<Seq<Follower>> {
    return this.followers;
  }

  getSpecialMeeples(): Arr<Seq<Special>> {
    return this.specialMeeples;
  }

  findFollower(meepleId: string): Option<Follower> {
    for (const l of this.followers) {
      const res = l.find((f) => f.getId() === meepleId);
      if (!res.isEmpty()) {
        return res;
      }
    }
    return Option.none<Follower>();
  }

  getTurnPlayer(): Player | null {
    return this.turnPlayerIndex === null ? null : this.getPlayer(this.turnPlayerIndex);
  }
}
