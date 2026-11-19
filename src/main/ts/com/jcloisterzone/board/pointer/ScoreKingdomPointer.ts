import type { BoardPointer } from "./BoardPointer.js";
import type { FeaturePointer } from "./FeaturePointer.js";
import type { Position } from "../Position.js";

/**
 * The source of a Kingdoms final score: the capital (a pointer into the city on the palace tile),
 * every field touching the capital, and every city those fields touch — the ones counted.
 *
 * The points alone ("3 × 5 cities") don't show which cities those were; the client highlights the
 * capital, the field shapes and the counted cities from this. One pointer per feature is enough:
 * the client resolves the whole feature from any of its places.
 */
export class ScoreKingdomPointer implements BoardPointer {
  constructor(
    private readonly capital: FeaturePointer,
    private readonly fields: readonly FeaturePointer[],
    private readonly cities: readonly FeaturePointer[],
    private readonly cityOfCarcassonne: boolean,
  ) {}

  asFeaturePointer(): FeaturePointer {
    return this.capital;
  }

  getPosition(): Position {
    return this.capital.getPosition();
  }

  getFields(): readonly FeaturePointer[] {
    return this.fields;
  }

  getCities(): readonly FeaturePointer[] {
    return this.cities;
  }

  /** A touched field also touches the City of Carcassonne (counted as one city). */
  isCityOfCarcassonne(): boolean {
    return this.cityOfCarcassonne;
  }

  toString(): string {
    return `[${this.capital},fields=${this.fields.length},cities=${this.cities.length}]`;
  }
}
