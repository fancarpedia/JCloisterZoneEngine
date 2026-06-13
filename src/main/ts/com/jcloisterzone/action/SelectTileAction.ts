import type { Set } from "../../../io/vavr/Set.js";
import type { Position } from "../board/Position.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** Base for actions whose options are board positions. */
export abstract class SelectTileAction extends AbstractPlayerAction<Position> {
  constructor(options: Set<Position>) {
    super(options);
  }
}
