import { HashSet, type Set } from "../../../../io/vavr/Set.js";
import { Seq } from "../../../../io/vavr/Seq.js";
import { List, Stream, Vector } from "../../../../io/vavr/SeqTypes.js";
import { Tuple2 } from "../../../../io/vavr/Tuple.js";
import type { ClassToken } from "../../../../lang/Class.js";
import type { Position } from "../../board/Position.js";
import { Location } from "../../board/Location.js";
import type { FeaturePointer } from "../../board/pointer/FeaturePointer.js";
import { Acrobats } from "../../feature/Acrobats.js";
import { Circus } from "../../feature/Circus.js";
import { CourierLetter } from "../../feature/CourierLetter.js";
import { SoloveiRazboynik } from "../../feature/SoloveiRazboynik.js";
import { Castle } from "../../feature/Castle.js";
import { type Completable, isInstanceOfCompletable } from "../../feature/Completable.js";
import { FlyingMachine } from "../../feature/FlyingMachine.js";
import { GamblersLuckShield } from "../../feature/GamblersLuckShield.js";
import { Field } from "../../feature/Field.js";
import { Garden } from "../../feature/Garden.js";
import { City } from "../../feature/City.js";
import { Monastery } from "../../feature/Monastery.js";
import { MonasteriesCapability } from "../capability/MonasteriesCapability.js";
import { FishermenCapability } from "../capability/FishermenCapability.js";
import { River } from "../../feature/River.js";
import { Road } from "../../feature/Road.js";
import { type Structure, isInstanceOfStructure } from "../../feature/Structure.js";
import { Tower } from "../../feature/Tower.js";
import { Barn } from "../../figure/Barn.js";
import { Obelisk } from "../../figure/Obelisk.js";
import { DeploymentCheckResult } from "../../figure/DeploymentCheckResult.js";
import type { Meeple } from "../../figure/Meeple.js";
import { Special } from "../../figure/Special.js";
import { MeepleAction } from "../../action/MeepleAction.js";
import type { PlayerAction } from "../../action/PlayerAction.js";
import { DeployMeepleMessage } from "../../io/message/DeployMeepleMessage.js";
import { PayRansomMessage } from "../../io/message/PayRansomMessage.js";
import { PayRansom } from "../../reducers/PayRansom.js";
import { DeployMeeple } from "../../reducers/DeployMeeple.js";
import type { Capability } from "../Capability.js";
import { BarnCapability } from "../capability/BarnCapability.js";
import { ObeliskCapability } from "../capability/ObeliskCapability.js";
import { FlierRollEvent } from "../../event/FlierRollEvent.js";
import { PlayEventMeta } from "../../event/PlayEvent.js";
import { ActionsState } from "../state/ActionsState.js";
import { Flag } from "../state/Flag.js";
import type { GameState } from "../state/GameState.js";
import type { PlacedTile } from "../state/PlacedTile.js";
import { PortalCapability } from "../capability/PortalCapability.js";
import { Phase, type PhaseHandler } from "./Phase.js";
import type { StepResult } from "./StepResult.js";

const BARN_CLS = BarnCapability as unknown as ClassToken<Capability<FeaturePointer | null>>;
const OBELISK_CLS = ObeliskCapability as unknown as ClassToken<Capability<FeaturePointer | null>>;


/** Base for action phases: compute meeple-deployment actions + handle DEPLOY_MEEPLE. */
export abstract class AbstractActionPhase extends Phase {
  private isMeepleDeploymentAllowedByCapabilities(state: GameState, pos: Position): boolean {
    for (const cap of state.getCapabilities().toSeq()) {
      if (!cap.isMeepleDeploymentAllowed(state, pos)) return false;
    }
    return true;
  }

  private getAvailableStructures(
    state: GameState,
    tiles: Stream<PlacedTile>,
    allowCompletedOn: Set<Position>,
  ): Seq<Tuple2<FeaturePointer, Structure>> {
    return tiles.flatMap((tile) => {
      const pos = tile.getPosition();
      if (!this.isMeepleDeploymentAllowedByCapabilities(state, pos)) {
        return Stream.empty<Tuple2<FeaturePointer, Structure>>();
      }
      let places = state
        .getTileFeatures2(pos)
        .filter((t) => isInstanceOfStructure(t._2)) as unknown as Seq<Tuple2<FeaturePointer, Structure>>;

      // exclude non-deployable structures (Castle / acrobats / circus / traps / shields / courier)
      places = places.filter(
        (t) =>
          !(t._2 instanceof Castle) &&
          !(t._2 instanceof SoloveiRazboynik) &&
          !(t._2 instanceof Acrobats) &&
          !(t._2 instanceof Circus) &&
          !(t._2 instanceof GamblersLuckShield) &&
          !(t._2 instanceof CourierLetter),
      );
      // rivers are deployable only with the Fishermen capability
      if (!state.hasCapability(FishermenCapability as never)) {
        places = places.filter((t) => !(t._2 instanceof River));
      }
      // towers handled by the Tower capability separately
      places = places.filter((t) => !(t._2 instanceof Tower));
      // a special (German) monastery may also be occupied as an abbot — modelled as
      // a virtual AS_ABBOT location on the monastery feature.
      places = places.flatMap((t) => {
        const struct = t._2;
        if (
          struct instanceof Monastery &&
          struct.isSpecialMonastery(state) &&
          state.hasCapability(MonasteriesCapability as unknown as ClassToken<never>)
        ) {
          return List.of(t, new Tuple2(t._1.setLocation(Location.AS_ABBOT), struct));
        }
        return List.of(t);
      }) as unknown as Seq<Tuple2<FeaturePointer, Structure>>;

      const allowCompleted = allowCompletedOn.contains(pos);
      if (!allowCompleted) {
        places = places.filter((t) => {
          if (t._1.getLocation() === Location.AS_ABBOT) return true; // monastery never completed
          return !isInstanceOfCompletable(t._2) || (t._2 as unknown as Completable).isOpen(state);
        });
      }
      if (state.hasFlag(Flag.FLYING_MACHINE_USED) || !allowCompleted) {
        places = places.filter((t) => t._1.getFeature() !== FlyingMachine);
      }
      return places;
    }) as Seq<Tuple2<FeaturePointer, Structure>>;
  }

  private getMeepleAvailableStructures(
    state: GameState,
    meeple: Meeple,
    structures: Seq<Tuple2<FeaturePointer, Structure>>,
    includeOccupied: boolean,
  ): Set<FeaturePointer> {
    let structs = structures;
    if (!includeOccupied) {
      structs = structs.filter((t) => {
        if (meeple instanceof Special) return true;
        const struct = t._2;
        const meeples =
          struct instanceof Monastery ? struct.getMeeplesIncludingMonastery(state) : struct.getMeeples(state);
        if (meeples.find((m) => m.interactingWithOtherMeeples()).isEmpty()) return true;
        // labyrinth: a road divided by labyrinth centres can hold a meeple per free segment
        if (struct instanceof Road && struct.isLabyrinth(state)) {
          const initialPart = state.getPlacedTile(t._1.getPosition())!.getInitialFeaturePartOf(t._1.getLocation()!);
          const initial = initialPart === null ? null : (initialPart._2 as Road);
          if (initial !== null && initial.isLabyrinth(state)) {
            // current tile is a labyrinth centre — allow if this exact spot is free
            return state.getDeployedMeeples().find((x) => t._1.equals(x._2)).isEmpty();
          }
          const segment = struct.findSegmentBorderedBy(state, t._1, (fp) => {
            const ip = state.getPlacedTile(fp.getPosition())!.getInitialFeaturePartOf(fp.getLocation()!);
            return ip !== null && (ip._2 as Road).isLabyrinth(state);
          });
          const segSet = HashSet.ofAll(segment);
          const segmentEmpty = state.getDeployedMeeples().find((x) => segSet.contains(x._2)).isEmpty();
          if (segmentEmpty) return true;
        }
        return false;
      }) as Seq<Tuple2<FeaturePointer, Structure>>;
    }
    return HashSet.ofAll(
      structs
        .filter((t) => meeple.isDeploymentAllowed(state, t._1, t._2) === DeploymentCheckResult.OK)
        .map((t) => t._1),
    );
  }

  protected prepareMeepleActions(
    state: GameState,
    meepleTypes: Vector<ClassToken<Meeple>>,
  ): Vector<PlayerAction<unknown>> {
    const player = state.getTurnPlayer()!;
    const availMeeples = player.getMeeplesFromSupply(state, meepleTypes);

    const lastPlaced = state.getLastPlaced()!;
    const currentTilePos = lastPlaced.getPosition();
    // Magic Portal: until used this turn, regular followers may deploy on any tile's open
    // feature; special meeples stay restricted to the just-placed tile.
    let allRegularMeepleStructures: Seq<Tuple2<FeaturePointer, Structure>>;
    let specialMeepleStructures: Seq<Tuple2<FeaturePointer, Structure>>;
    if (
      lastPlaced.getTile().hasModifier(PortalCapability.MAGIC_PORTAL) &&
      !state.getFlags().contains(Flag.PORTAL_USED)
    ) {
      const allTiles = Stream.ofAll(state.getPlacedTiles().values()) as Stream<PlacedTile>;
      allRegularMeepleStructures = this.getAvailableStructures(state, allTiles, HashSet.of(currentTilePos));
      specialMeepleStructures = this.getAvailableStructures(
        state,
        Stream.of(lastPlaced),
        HashSet.of(currentTilePos),
      );
    } else {
      allRegularMeepleStructures = this.getAvailableStructures(
        state,
        Stream.of(lastPlaced),
        HashSet.of(currentTilePos),
      );
      specialMeepleStructures = allRegularMeepleStructures;
    }

    const regularMeepleStructures = allRegularMeepleStructures.filter((t) => {
      const requiredCapability = t._2.getRequiredCapability();
      return requiredCapability === null || state.getCapabilities().contains(requiredCapability);
    }) as Seq<Tuple2<FeaturePointer, Structure>>;

    const actions = availMeeples.map((meeple) => {
      const locations = this.getMeepleAvailableStructures(
        state,
        meeple,
        meeple instanceof Special ? specialMeepleStructures : regularMeepleStructures,
        false,
      );
      return new MeepleAction(meeple, locations) as unknown as PlayerAction<unknown>;
    });

    return actions.filter((action) => !action.isEmpty()) as Vector<PlayerAction<unknown>>;
  }

  handleDeployMeeple(state: GameState, msg: DeployMeepleMessage): StepResult {
    const fp = msg.getPointer()!;
    if (fp.getFeature() === FlyingMachine) {
      return this.handleDeployFlier(state, msg);
    }

    const meeple = state.getActivePlayer()!.getMeepleFromSupply(state, msg.getMeepleId()!)!;
    const action = state
      .getPlayerActions()!
      .getActions()
      .find((a) => a instanceof MeepleAction && (a as MeepleAction).getMeepleType() === (meeple as object).constructor)
      .get() as MeepleAction;
    if (action.getOptions().find((p) => fp.equals(p)).isEmpty()) {
      throw new Error("Invalid placement of meeple " + fp.toString());
    }
    const placedTile = state.getLastPlaced()!;
    if (
      fp.getFeature() !== Tower &&
      placedTile.getTile().hasModifier(PortalCapability.MAGIC_PORTAL) &&
      !fp.getPosition().equals(placedTile.getPosition())
    ) {
      state = state.addFlag(Flag.PORTAL_USED);
    }

    state = new DeployMeeple(meeple, fp).apply(state);
    if (meeple instanceof Barn) {
      state = state.setCapabilityModel<FeaturePointer | null>(BARN_CLS, fp);
    }
    if (meeple instanceof Obelisk) {
      state = state.setCapabilityModel<FeaturePointer | null>(OBELISK_CLS, fp);
    }

    state = this.clearActions(state);
    return this.next(state);
  }

  private getTargetPosition(pos: Position, direction: Location, distance: number): Position {
    let p = pos;
    for (let i = 0; i < distance; i++) p = p.add(direction);
    return p;
  }

  /** Deploying on a flying machine rolls a 1–3 die and flies the meeple that many
   *  tiles in the machine's direction, then offers a feature there (or nothing). */
  protected handleDeployFlier(state: GameState, msg: DeployMeepleMessage): StepResult {
    const placedTile = state.getLastPlaced()!;
    const flyingMachine = state.getFeature(msg.getPointer()!) as FlyingMachine;
    const meeple = state.getActivePlayer()!.getMeepleFromSupply(state, msg.getMeepleId()!)!;

    const distance = this.getRandom().getNextInt(3) + 1;
    state = state.addFlag(Flag.FLYING_MACHINE_USED);
    state = state.appendEvent(
      new FlierRollEvent(PlayEventMeta.createWithActivePlayer(state), placedTile.getPosition(), distance),
    );

    const target = this.getTargetPosition(placedTile.getPosition(), flyingMachine.getDirection(), distance);
    const targetTile = state.getPlacedTile(target);
    if (targetTile === null || !this.isMeepleDeploymentAllowedByCapabilities(state, target)) {
      return this.next(state); // landed on empty / disallowed tile
    }

    let structures = this.getAvailableStructures(state, Stream.of(targetTile), HashSet.empty<Position>());
    structures = structures.filter((t) => !(t._2 instanceof Field)) as typeof structures;
    const options = this.getMeepleAvailableStructures(state, meeple, structures, true);
    if (options.isEmpty()) {
      return this.next(state);
    }

    const action = new MeepleAction(meeple, options);
    state = state.setPlayerActions(new ActionsState(state.getTurnPlayer()!, action as unknown as PlayerAction<unknown>, false));
    return this.promote(state);
  }

  /** In an action phase, paying ransom frees a follower → recompute the meeple actions. */
  override handlePayRansom(state: GameState, msg: PayRansomMessage): StepResult {
    state = new PayRansom(msg.getMeepleId()).apply(state);
    return this.enter(state);
  }

  protected override messageHandlers(): Map<Function, PhaseHandler> {
    const m = super.messageHandlers();
    m.set(DeployMeepleMessage, this.handleDeployMeeple);
    m.set(PayRansomMessage, this.handlePayRansom);
    return m;
  }
}
