import { Valued, combineHash, hashCode } from "../../../../io/vavr/equality.js";
import type { TunnelCapability } from "../capability/TunnelCapability.js";

type Tunnel = TunnelCapability.Tunnel;

/** A tunnel token placed on the board by a player. */
export class PlacedTunnelToken implements Valued {
  constructor(
    private readonly playerIndex: number,
    private readonly token: Tunnel,
  ) {}

  getPlayerIndex(): number {
    return this.playerIndex;
  }

  getToken(): Tunnel {
    return this.token;
  }

  hashCode(): number {
    return combineHash(this.playerIndex, hashCode(this.token));
  }

  equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof PlacedTunnelToken)) return false;
    return this.playerIndex === obj.playerIndex && this.token === obj.token;
  }

  toString(): string {
    return `${this.playerIndex} ${this.token}`;
  }
}
