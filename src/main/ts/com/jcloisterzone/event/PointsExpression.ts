import { List } from "../../../io/vavr/SeqTypes.js";
import { ExprItem } from "./ExprItem.js";

/** A named, additive breakdown of points (a name plus a list of {@link ExprItem}s). */
export class PointsExpression {
  private readonly name: string;
  private readonly items: List<ExprItem>;

  constructor(name: string, items: List<ExprItem>);
  constructor(name: string, ...items: ExprItem[]);
  constructor(name: string, first?: List<ExprItem> | ExprItem, ...rest: ExprItem[]) {
    this.name = name;
    if (first === undefined) {
      this.items = List.empty<ExprItem>();
    } else if (first instanceof List) {
      this.items = first;
    } else {
      this.items = List.of(first, ...rest);
    }
  }

  getPoints(): number {
    return this.items.map((exp) => exp.getPoints()).sum();
  }

  getName(): string {
    return this.name;
  }

  getItems(): List<ExprItem> {
    return this.items;
  }

  merge(expr: PointsExpression | null): PointsExpression {
    if (expr === null || expr.getPoints() === 0) {
      return this;
    }
    const items = this.items.appendAll(expr.items) as List<ExprItem>;
    return new PointsExpression(this.name + "+" + expr.name, items);
  }

  append(item: ExprItem): PointsExpression {
    return new PointsExpression(this.name, this.items.append(item) as List<ExprItem>);
  }

  appendAll(items: List<ExprItem>): PointsExpression {
    return new PointsExpression(this.name, this.items.appendAll(items) as List<ExprItem>);
  }
}
