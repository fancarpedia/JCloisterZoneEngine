import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { HashSet } from "../../../../io/vavr/Set.js";
import { Queue } from "../../../../io/vavr/SeqTypes.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import type { ClassToken } from "../../../../lang/Class.js";
import { ScoreFirstAction } from "../../action/ScoreFirstAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { Barn } from "../../figure/Barn.js";
import { Wagon } from "../../figure/Wagon.js";
import type { Capability } from "../Capability.js";
import { BarnCapability } from "../capability/BarnCapability.js";
import { WagonCapability, type WagonModel } from "../capability/WagonCapability.js";
import type { Completable } from "../../feature/Completable.js";
import { Field } from "../../feature/Field.js";
import type { Scoreable } from "../../feature/Scoreable.js";
import { ScoreFirstMessage } from "../../io/message/ScoreFirstMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { ReturnMeepleSource } from "../ReturnMeepleSource.js";
import { ScoreCompletable } from "../../reducers/ScoreCompletable.js";
import { ScoreField } from "../../reducers/ScoreField.js";
import { ScoreFieldWhenBarnIsConnected } from "../../reducers/ScoreFieldWhenBarnIsConnected.js";
import { UndeployMeeples } from "../../reducers/UndeployMeeples.js";
import type { ScoreFeatureReducer } from "../ScoreFeatureReducer.js";
import {
  isInstanceOfContestedScoring,
  type ContestedScoring,
  type ScoringSession,
} from "../scoring/ContestedScoring.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import { collectCompletedThisTurn } from "./collectCompletedThisTurn.js";
import type { StepResult } from "./StepResult.js";

const WAGON_CLS = WagonCapability as unknown as ClassToken<Capability<WagonModel>>;
const BARN_CLS = BarnCapability as unknown as ClassToken<Capability<FeaturePointer | null>>;

/** A capability that both implements ContestedScoring and can hold the session as its model. */
type Provider = ContestedScoring & Capability<ScoringSession | null>;

/**
 * Scores features completed by the just-placed tile.
 *
 * Usually in one go. Under a ContestedScoring capability (Castles) the ORDER can change the result
 * - a castle takes the points of the first feature scored beside it - so when two or more completed
 * features sit beside one castle the turn player picks which is scored first (SCORE_FIRST). The
 * phase then waits, keeping its progress in GameState (see ScoringSession), and resumes on the
 * answer. Anything not in question is scored first ("forced first"); a forced chain of castles can
 * settle a castle before the player is ever asked about it.
 *
 * Without such a capability, or when nothing is contested, the sequence is exactly the original:
 * watchtower (beforeCompletableScore) → features → barn → return meeples → castles → onTurnScoring.
 */
export class ScoringPhase extends Phase {
  static readonly simpleName = "ScoringPhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(ScoreFirstMessage, this.handleScoreFirst as PhaseHandler);
    return m;
  }

  enter(state: GameState): StepResult {
    const lastPlaced = state.getLastPlaced()!;
    const pos = lastPlaced.getPosition();
    // record wagons deployed BEFORE scoring (so we can detect which got returned)
    const wagonsBefore: Array<[Wagon, FeaturePointer]> = [];
    for (const t of state.getDeployedMeeples()) {
      if (t._1 instanceof Wagon) wagonsBefore.push([t._1, t._2]);
    }

    // Which completables finished this turn — shared with CocScoringPhase so the two phases
    // never drift (see collectCompletedThisTurn). Order is preserved for deterministic scoring.
    const completed: Completable[] = [...collectCompletedThisTurn(state)];

    // Watchtower lives here: it is scored before any feature, and therefore before any castle.
    const completedSet = HashSet.ofAll(completed);
    for (const cap of state.getCapabilities().toSeq()) {
      state = cap.beforeCompletableScore(state, completedSet);
    }

    // Features whose order the turn player must decide are held back; everything else is scored
    // now, in the original order. With nothing contested, `forced` is every completed feature.
    const provider = this.findProvider(state);
    const contested = provider === null ? [] : provider.contestedFeatures(state, completed);
    const forced = completed.filter((f) => !contested.includes(f));

    const reducers = new globalThis.Map<Completable, ScoreCompletable>();
    for (const feature of forced) {
      const reducer = new ScoreCompletable(feature, false);
      reducers.set(feature, reducer);
      state = reducer.apply(state);
    }

    // barn field scoring (Abbey & Mayor)
    if (state.hasCapability(BARN_CLS)) {
      const placedBarnPtr = state.getCapabilityModel<FeaturePointer | null>(BARN_CLS);
      const placedBarnField =
        placedBarnPtr === null || placedBarnPtr === undefined
          ? null
          : (state.getFeature(placedBarnPtr) as Field);
      if (placedBarnField !== null) {
        // ScoreField scores only the followers on the field; the barn stays
        state = new ScoreField(placedBarnField, false, "barn-placed").apply(state);
        state = new UndeployMeeples(placedBarnField, true, ReturnMeepleSource.BARN_PLACEMENT).apply(state);
      }
      // fields newly joined (by this tile) to a field that already holds a barn
      for (const t of state.getTileFeatures2(pos)) {
        const f = t._2;
        if (f === placedBarnField || !(f instanceof Field)) continue;
        if (f.getSpecialMeeples(state).find((m) => m instanceof Barn).isEmpty()) continue;
        state = new ScoreFieldWhenBarnIsConnected(f).apply(state);
        state = new UndeployMeeples(f, true, ReturnMeepleSource.BARN_FIELD_JOIN).apply(state);
      }
    }

    for (const feature of forced) {
      state = new UndeployMeeples(feature, false).apply(state);
    }

    let scored: VMap<Scoreable, ScoreFeatureReducer> = HashMap.empty<Scoreable, ScoreFeatureReducer>();
    for (const [k, v] of reducers) {
      scored = scored.put(k as unknown as Scoreable, v);
    }
    // castles take the score of a feature in their vicinity (and chain on to their neighbours)
    if (provider !== null) {
      const res = provider.scoreTriggered(state, this.asCompletedMap(reducers));
      state = res._1;
      scored = scored.merge(res._2);
    }

    return this.resolve(state, provider, {
      pending: contested.map((f) => f.getPlaces().head()),
      scored,
      wagonsBefore,
    });
  }

  /**
   * SCORE_FIRST: the turn player picked which contested feature is scored first. It is scored, the
   * castles it triggers score from it, any chain follows - then the rest is re-examined.
   */
  handleScoreFirst(state: GameState, msg: ScoreFirstMessage): StepResult {
    const provider = this.findProvider(state);
    const session = provider === null ? null : provider.getModel(state);
    if (provider === null || session === null || session === undefined) {
      throw new Error("SCORE_FIRST: no scoring is waiting for a choice");
    }
    const pointer = msg.getPointer();
    const contested = provider.contestedFeatures(state, this.resolvePending(state, session));
    const chosen = pointer === null ? undefined : contested.find((f) => f.getPlaces().contains(pointer));
    if (chosen === undefined) {
      throw new Error(`SCORE_FIRST: ${pointer} is not a feature whose scoring order is open`);
    }
    state = this.clearActions(state);
    const step = this.scoreFeatures(state, provider, session, [chosen]);
    return this.resolve(step._1, provider, step._2);
  }

  /**
   * Score what is forced, ask about what is contested, finish when nothing is left. Forced first:
   * a forced feature's castle chain may reach a contested castle and settle it before the player
   * is asked, which can remove the question altogether.
   */
  private resolve(state: GameState, provider: Provider | null, session: ScoringSession): StepResult {
    while (provider !== null && session.pending.length > 0) {
      const pending = this.resolvePending(state, session);
      const contested = provider.contestedFeatures(state, pending);
      const forced = pending.filter((f) => !contested.includes(f));
      if (forced.length > 0) {
        const step = this.scoreFeatures(state, provider, session, forced);
        state = step._1;
        session = step._2;
        continue;
      }
      // Only contested features left: wait for the turn player.
      const options = HashSet.ofAll(contested.map((f) => f.getPlaces().head()));
      state = provider.setModel(state, session);
      state = state.setPlayerActions(
        new ActionsState(
          state.getTurnPlayer()!,
          new ScoreFirstAction(options) as unknown as PlayerAction<unknown>,
          false,
        ),
      );
      return this.promote(state);
    }
    if (provider !== null) {
      state = provider.setModel(state, null);
    }
    return this.finish(state, session);
  }

  /** Score these features, return their meeples, then score what they trigger. */
  private scoreFeatures(
    state: GameState,
    provider: Provider,
    session: ScoringSession,
    features: Completable[],
  ): Tuple2<GameState, ScoringSession> {
    const reducers = new globalThis.Map<Completable, ScoreCompletable>();
    for (const feature of features) {
      const reducer = new ScoreCompletable(feature, false);
      reducers.set(feature, reducer);
      state = reducer.apply(state);
    }
    for (const feature of features) {
      state = new UndeployMeeples(feature, false).apply(state);
    }
    let scored = session.scored;
    for (const [k, v] of reducers) {
      scored = scored.put(k as unknown as Scoreable, v);
    }
    const res = provider.scoreTriggered(state, this.asCompletedMap(reducers));
    state = res._1;
    scored = scored.merge(res._2);
    return new Tuple2(state, {
      pending: session.pending.filter((fp) => !features.some((f) => f.getPlaces().contains(fp))),
      scored,
      wagonsBefore: session.wagonsBefore,
    });
  }

  /** onTurnScoring for everything scored this turn, then hand returned wagons to WagonPhase. */
  private finish(state: GameState, session: ScoringSession): StepResult {
    for (const cap of state.getCapabilities().toSeq()) {
      state = cap.onTurnScoring(state, session.scored as HashMap<Scoreable, ScoreFeatureReducer>);
    }

    // record wagons that were RETURNED by scoring, in play order, for WagonPhase
    const wagonsBefore = session.wagonsBefore;
    if (wagonsBefore.length > 0 && state.hasCapability(WAGON_CLS)) {
      const afterWagons = new globalThis.Set<Wagon>();
      for (const t of state.getDeployedMeeples()) if (t._1 instanceof Wagon) afterWagons.add(t._1);
      const returned = wagonsBefore.filter(([w]) => !afterWagons.has(w));
      if (returned.length > 0) {
        const ps = state.getPlayers();
        const n = ps.getPlayers().size();
        const turnIdx = ps.getTurnPlayerIndex()!;
        let model = Queue.empty<Tuple2<Wagon, FeaturePointer>>();
        for (let i = 0; i < n; i++) {
          const p = ps.getPlayer((turnIdx + i) % n);
          for (const [w, fp] of returned) {
            if (w.getPlayer().equals(p)) model = model.enqueue(new Tuple2(w, fp));
          }
        }
        state = state.setCapabilityModel<WagonModel>(WAGON_CLS, model);
      }
    }

    return this.next(state);
  }

  /** The capability under which scoring order can matter; null when there is none in the game. */
  private findProvider(state: GameState): Provider | null {
    for (const cap of state.getCapabilities().toSeq()) {
      if (isInstanceOfContestedScoring(cap)) return cap as unknown as Provider;
    }
    return null;
  }

  /** Re-read the pending features from the CURRENT state - they are kept as pointers. */
  private resolvePending(state: GameState, session: ScoringSession): Completable[] {
    return session.pending.map((fp) => state.getFeature(fp) as unknown as Completable);
  }

  private asCompletedMap(
    reducers: globalThis.Map<Completable, ScoreCompletable>,
  ): VMap<Completable, ScoreFeatureReducer> {
    let map: VMap<Completable, ScoreFeatureReducer> = HashMap.empty();
    for (const [k, v] of reducers) map = map.put(k, v);
    return map;
  }
}
