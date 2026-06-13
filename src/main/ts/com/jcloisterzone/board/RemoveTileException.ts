/** When thrown by a capability's initTile, the tile is excluded from the tile pack. */
export class RemoveTileException extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "RemoveTileException";
  }
}
