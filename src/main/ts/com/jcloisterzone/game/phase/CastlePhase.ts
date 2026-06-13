import type { LinkedHashMap } from "../../../../io/vavr/Map.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { List } from "../../../../io/vavr/SeqTypes.js";
import type { Player } from "../../Player.js";
import { CastleAction } from "../../action/CastleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { MeeplePointer } from "../../board/pointer/MeeplePointer.js";
import { CastleCreated } from "../../event/CastleCreated.js";
import { MeepleDeployed } from "../../event/MeepleDeployed.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import { Castle } from "../../feature/Castle.js";
import { City } from "../../feature/City.js";
import type { Meeple } from "../../figure/Meeple.js";
import type { PlaceTokenMessage } from "../../io/message/PlaceTokenMessage.js";
import { PlaceTokenMessage as PlaceTokenMessageClass } from "../../io/message/PlaceTokenMessage.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { CastleCapability } from "../capability/CastleCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import { Flag } from "../state/Flag.js";
import type { GameState } from "../state/GameState.js";
import type { NeutralFiguresState } from "../state/NeutralFiguresState.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { RewindActionContainer } from "./RewindActionContainer.js";
import type { StepResult } from "./StepResult.js";

/** After the action phase, each player (starting from the turn player) may convert
 *  an eligible 2-tile city holding only their own single follower into a castle. */
export class CastlePhase extends Phase {
  static readonly simpleName = "CastlePhase";

  constructor(
    random: RandomGenerator,
    defaultNext: Phase | null,
    rewindActionContainer: RewindActionContainer | null = null,
  ) {
    super(random, defaultNext, rewindActionContainer);
  }

  private getPlayerOptions(state: GameState, player: Player): Set<FeaturePointer> {
    if (state.getPlayers().getPlayerTokenCount(player.getIndex(), CastleCapability.CastleToken.CASTLE) === 0) {
      return HashSet.empty<FeaturePointer>();
    }
    const pos = state.getLastPlaced()!.getPosition();
    const fps: FeaturePointer[] = [];
    for (const t of state.getTileFeatures2(pos, City)) {
      const city = t._2 as City;
      if (!city.hasModifier(state, CastleCapability.CASTLE_BASE)) continue;
      if (city.getPlaces().size() !== 2) continue;
      const followers = List.ofAll(city.getFollowers(state));
      if (followers.size() !== 1) continue;
      if (!followers.get(0).getPlayer().equals(player)) continue;
      fps.push(t._1);
    }
    return HashSet.ofAll(fps);
  }

  private prepareActions(state: GameState, continueWith: Player): StepResult {
    const turnPlayer = state.getTurnPlayer()!;
    let player = continueWith;
    do {
      const options = this.getPlayerOptions(state, player);
      if (!options.isEmpty()) {
        const action = new CastleAction(options);
        return this.promote(
          state.setPlayerActions(new ActionsState(player, action as unknown as PlayerAction<unknown>, true)),
        );
      }
      player = player.getNextPlayer(state);
    } while (!player.equals(turnPlayer));
    return this.next(state);
  }

  enter(state: GameState): StepResult {
    return this.prepareActions(state, state.getTurnPlayer()!);
  }

  handlePlaceToken(state: GameState, msg: PlaceTokenMessage): StepResult {
    if (msg.getToken() !== CastleCapability.CastleToken.CASTLE) {
      throw new Error("Illegal castle token");
    }
    state = state.addFlag(Flag.POST_WOOD_ACTION_STARTED);
    const player = state.getActivePlayer()!;
    const cityPtr = msg.getPointer() as FeaturePointer;
    const city = state.getFeature(cityPtr) as City;
    const castle = new Castle(city.getPlaces().map((fp) => fp.setFeature(Castle as never)) as List<FeaturePointer>);

    const fairyPtr = state.getNeutralFigures().getFairyDeployment();
    const fairyMeeplePtr = fairyPtr instanceof MeeplePointer ? fairyPtr : null;

    state = state.mapPlayers((ps) =>
      ps.addTokenCount(player.getIndex(), CastleCapability.CastleToken.CASTLE, -1),
    );
    state = state.appendEvent(new CastleCreated(PlayEventMeta.createWithPlayer(player), castle));

    for (const t of city.getFollowers2(state)) {
      const newFp = t._2.setFeature(Castle as never);
      if (fairyMeeplePtr !== null && fairyMeeplePtr.asFeaturePointer().equals(t._2)) {
        const newFairyPtr = fairyMeeplePtr.setFeaturePointer(newFp);
        state = state.mapNeutralFigures((nf) => {
          const fairy = nf.getFairy()!;
          return nf.setDeployedNeutralFigures(
            nf.getDeployedNeutralFigures().put(fairy, newFairyPtr) as ReturnType<
              NeutralFiguresState["getDeployedNeutralFigures"]
            >,
          );
        });
      }
      const meeples = state.getDeployedMeeples();
      state = state.setDeployedMeeples(
        meeples.put(t._1, newFp) as LinkedHashMap<Meeple, FeaturePointer>,
      );
      state = state.appendEvent(
        new MeepleDeployed(PlayEventMeta.createWithActivePlayer(state), t._1, newFp, msg.getPointer()),
      );
    }

    state = state.mapFeatureMap((m) => {
      for (const fp of city.getPlaces()) {
        const pos = fp.getPosition();
        m = m.put(pos, m.get(pos).get().remove(fp).put(fp.setFeature(Castle as never), castle));
      }
      return m;
    });

    const nextPlayer = player.getNextPlayer(state);
    state = this.clearActions(state);
    if (nextPlayer.equals(state.getTurnPlayer())) {
      return this.next(state);
    }
    // another player may also create a castle
    return this.prepareActions(state, nextPlayer);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(PlaceTokenMessageClass, this.handlePlaceToken);
    return m;
  }
}
