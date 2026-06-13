import { simpleName, type ClassToken } from "../../../lang/Class.js";
import type { Player } from "../Player.js";
import type { Meeple } from "./Meeple.js";

/** Generates stable, sequential meeple ids per player, e.g. "0.small.1". */
export class MeepleIdProvider {
  private readonly player: Player;
  private readonly ids: Map<ClassToken<Meeple>, number>;

  constructor(player: Player) {
    this.player = player;
    this.ids = new Map();
  }

  generateId(clazz: ClassToken<Meeple>): string {
    let n = this.ids.get(clazz);
    if (n === undefined) {
      n = 1;
      this.ids.set(clazz, 1);
    } else {
      n++;
      this.ids.set(clazz, n);
    }
    const type = simpleName(clazz).toLowerCase().replace("follower", "");
    return `${this.player.getIndex()}.${type}.${n}`;
  }
}
