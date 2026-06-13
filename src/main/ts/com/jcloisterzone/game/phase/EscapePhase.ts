import { Location } from "../../board/Location.js";
import type { Position } from "../../board/Position.js";
import { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { MeeplePointer } from "../../board/pointer/MeeplePointer.js";
import { ReturnMeepleAction } from "../../action/ReturnMeepleAction.js";
import { City } from "../../feature/City.js";
import { Monastery } from "../../feature/Monastery.js";
import type { Meeple } from "../../figure/Meeple.js";
import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { Stream } from "../../../../io/vavr/SeqTypes.js";
import type { Seq } from "../../../../io/vavr/Seq.js";
import type { RandomGenerator } from "../../random/RandomGenerator.js";
import { UndeployMeeple } from "../../reducers/UndeployMeeple.js";
import { ReturnMeepleSource } from "../ReturnMeepleSource.js";
import { Rule } from "../Rule.js";
import { SiegeCapability } from "../capability/SiegeCapability.js";
import { ActionsState } from "../state/ActionsState.js";
import type { GameState } from "../state/GameState.js";
import type { PlacedTile } from "../state/PlacedTile.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";
import type { ReturnMeepleMessage } from "../../io/message/ReturnMeepleMessage.js";
import { ReturnMeepleMessage as ReturnMeepleMessageClass } from "../../io/message/ReturnMeepleMessage.js";

/** The Escape variant (Siege / Cathars): a follower in a besieged city that lies on, or adjacent
 *  (incl. diagonally) to, a cloister tile may flee back to its owner's supply. When
 *  {@code Rule.ESCAPE_VARIANT == "siege-tile"} only the besieged-city (siege) tile itself counts
 *  as an escape tile. */
export class EscapePhase extends Phase {
  static readonly simpleName = "EscapePhase";

  constructor(random: RandomGenerator, defaultNext: Phase | null) {
    super(random, defaultNext);
  }

  enter(state: GameState): StepResult {
    const player = state.getTurnPlayer()!;
    const cities = state
      .getFeatures(City)
      .filter((c) => c.hasModifier(state, City.BESIEGED))
      .filter((c) => c.isOccupiedBy(state, player));

    const cloisterExists = (pos: Position): boolean =>
      state.getFeature(new FeaturePointer(pos, Monastery as never, Location.I)) !== null;

    const siegeTileOnly = state.getStringRule(Rule.ESCAPE_VARIANT) === "siege-tile";

    let options: Set<MeeplePointer> = HashSet.empty<MeeplePointer>();
    for (const city of cities) {
      let cityTiles: Seq<PlacedTile> = Stream.ofAll(city.getTilePositions()).map((pos) =>
        state.getPlacedTile(pos),
      ) as Seq<PlacedTile>;
      if (siegeTileOnly) {
        cityTiles = cityTiles.filter((pt) => pt.getTile().hasModifier(SiegeCapability.SIEGE_ESCAPE_TILE));
      }

      const adjacent = cityTiles
        .map((pt) => pt.getPosition())
        .flatMap((pos) => state.getAdjacentAndDiagonalTiles(pos));

      const nearCloister = Stream.concat(cityTiles, adjacent)
        .distinct()
        .map((pt) => pt.getPosition())
        .find(cloisterExists)
        .isDefined();

      if (!nearCloister) continue;

      for (const t of city.getFollowers2(state)) {
        if (!t._1.getPlayer().equals(player)) continue;
        options = options.add(new MeeplePointer(t));
      }
    }

    if (options.isEmpty()) {
      return this.next(state);
    }

    return this.promote(
      state.setPlayerActions(
        new ActionsState(player, new ReturnMeepleAction(options, ReturnMeepleSource.SIEGE_ESCAPE), true),
      ),
    );
  }

  handleReturnMeeple(state: GameState, msg: ReturnMeepleMessage): StepResult {
    const ptr = msg.getPointer()!;
    const meeple = state
      .getDeployedMeeples()
      .find((m) => ptr.match(m._1))
      .map((t) => t._1)
      .getOrNull() as Meeple | null;
    if (meeple === null) throw new Error("Pointer doesn't match any meeple");

    if (msg.getReturnMeepleSource() !== ReturnMeepleSource.SIEGE_ESCAPE) {
      throw new Error("Return meeple is not allowed");
    }

    const escapeAction = state.getAction() as ReturnMeepleAction;
    if (!(escapeAction.getOptions() as Set<MeeplePointer>).contains(ptr)) {
      throw new Error("Pointer doesn't match action");
    }

    state = new UndeployMeeple(meeple, true, ReturnMeepleSource.SIEGE_ESCAPE).apply(state);
    state = this.clearActions(state);
    return this.next(state);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(ReturnMeepleMessageClass, this.handleReturnMeeple);
    return m;
  }
}
