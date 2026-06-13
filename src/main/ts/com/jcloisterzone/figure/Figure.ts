import { Valued, equals as vEquals, hashString } from "../../../io/vavr/equality.js";
import type { Location } from "../board/Location.js";
import { Position } from "../board/Position.js";
import { FeaturePointer } from "../board/pointer/FeaturePointer.js";
import type { BoardPointer } from "../board/pointer/BoardPointer.js";
import type { Feature } from "../feature/Feature.js";
import type { Structure } from "../feature/Structure.js";
import type { GameState } from "../game/state/GameState.js";

/** Base for all on-board figures (meeples and neutral figures). */
export abstract class Figure<T extends BoardPointer> implements Valued {
  private readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  getId(): string {
    return this.id;
  }

  abstract getDeployment(state: GameState): T | null;

  getFeature(state: GameState): Feature | null {
    const at = this.getDeployment(state);
    const fp = at === null ? null : at.asFeaturePointer();
    if (fp === null) return null;
    return state.getFeature(fp);
  }

  getLocation(state: GameState): Location | null {
    const at = this.getDeployment(state);
    const fp = at === null ? null : at.asFeaturePointer();
    return fp === null ? null : fp.getLocation();
  }

  getPosition(state: GameState): Position | null {
    const at = this.getDeployment(state);
    return at === null ? null : at.getPosition();
  }

  /** Dispatches the Java {@code at(...)} overloads by argument type. */
  at(state: GameState, target: BoardPointer | Structure): boolean {
    if (target instanceof Position) {
      return vEquals(target, this.getPosition(state));
    }
    if (target instanceof FeaturePointer) {
      const at = this.getDeployment(state);
      return vEquals(target, at === null ? null : at.asFeaturePointer());
    }
    return this.atStructure(state, target as Structure);
  }

  abstract atStructure(state: GameState, feature: Structure): boolean;

  /** true if the figure is deployed on the board. */
  isDeployed(state: GameState): boolean {
    return this.getDeployment(state) !== null;
  }

  /** Not necessarily the opposite of isDeployed — mind imprisoned followers. */
  isInSupply(state: GameState): boolean {
    return !this.isDeployed(state);
  }

  hashCode(): number {
    return hashString(this.id);
  }

  equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof Figure)) return false;
    return this.id === obj.id;
  }

  toString(): string {
    return this.id;
  }
}
