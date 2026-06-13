/** A tag attached to tiles, usually associated with special behaviour (hill, vineyard...). */
export class TileModifier {
  constructor(private readonly name: string) {}

  toString(): string {
    return this.name;
  }
}
