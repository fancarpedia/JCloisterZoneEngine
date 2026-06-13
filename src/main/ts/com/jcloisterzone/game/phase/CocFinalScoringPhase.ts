import { HashSet } from "../../../../io/vavr/Set.js";
import { List } from "../../../../io/vavr/SeqTypes.js";
import type { ClassToken } from "../../../../lang/Class.js";
import type { Player } from "../../Player.js";
import { Location } from "../../board/Location.js";
import { type Completable, isInstanceOfCompletable } from "../../feature/Completable.js";
import type { Feature } from "../../feature/Feature.js";
import { Field } from "../../feature/Field.js";
import { Rule } from "../Rule.js";
import type { Capability } from "../Capability.js";
import { CountCapability } from "../capability/CountCapability.js";
import { CountCapabilityModel } from "../capability/CountCapabilityModel.js";
import type { GameState } from "../state/GameState.js";
import { AbstractCocScoringPhase } from "./AbstractCocScoringPhase.js";
import type { Phase } from "./Phase.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import type { StepResult } from "./StepResult.js";

const COUNT_CLS = CountCapability as unknown as ClassToken<Capability<CountCapabilityModel>>;


/** Final-scoring Count districts: each player in turn may move a follower from an unfinished
 *  feature (or any field) onto a city district, until all have passed. */
export class CocFinalScoringPhase extends AbstractCocScoringPhase {
  static readonly simpleName = "CocFinalScoringPhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    const model = state.getCapabilityModel<CountCapabilityModel>(COUNT_CLS);
    state = state.setCapabilityModel<CountCapabilityModel>(
      COUNT_CLS,
      model.setFinalScoringPass(HashSet.empty<Player>()),
    );
    return this.nextPlayer(state, state.getTurnPlayer()!, true);
  }

  protected getValidQuarters(state: GameState): List<Location> {
    if (state.getStringRule(Rule.COC_FINAL_SCORING) === "market-only") {
      return List.of(Location.QUARTER_MARKET);
    }
    return Location.QUARTERS;
  }

  protected nextPlayer(state: GameState, player: Player, actionUsed: boolean): StepResult {
    let model = state.getCapabilityModel<CountCapabilityModel>(COUNT_CLS);
    if (!actionUsed) {
      model = model.setFinalScoringPass(model.getFinalScoringPass()!.add(player));
      state = state.setCapabilityModel<CountCapabilityModel>(COUNT_CLS, model);
    }

    let next = player;
    while (model.getFinalScoringPass()!.size() !== state.getPlayers().length()) {
      next = next.getNextPlayer(state);
      if (!model.getFinalScoringPass()!.contains(next)) {
        const res = this.processPlayer(state, next);
        if (res === null) {
          model = model.setFinalScoringPass(model.getFinalScoringPass()!.add(next));
          state = state.setCapabilityModel<CountCapabilityModel>(COUNT_CLS, model);
        } else {
          return res;
        }
      }
    }
    return this.endPhase(state);
  }

  protected getAllowedFeaturesFilter(state: GameState): (f: Feature) => boolean {
    return (f: Feature) => {
      if (f instanceof Field) return true;
      if (isInstanceOfCompletable(f)) return !(f as unknown as Completable).isCompleted(state);
      throw new Error("Unsupported feature");
    };
  }
}
