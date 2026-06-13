/** A single named, optionally-counted term in a {@link PointsExpression}. */
export class ExprItem {
  private readonly count: number | null;
  private readonly name: string;
  private readonly points: number;

  constructor(name: string, points: number);
  constructor(count: number | null, name: string, points: number);
  constructor(a: number | null | string, b: number | string, c?: number) {
    if (typeof a === "string") {
      // (name, points)
      this.count = null;
      this.name = a;
      this.points = b as number;
    } else {
      // (count, name, points)
      this.count = a;
      this.name = b as string;
      this.points = c as number;
    }
  }

  getCount(): number | null {
    return this.count;
  }

  getName(): string {
    return this.name;
  }

  getPoints(): number {
    return this.points;
  }
}
