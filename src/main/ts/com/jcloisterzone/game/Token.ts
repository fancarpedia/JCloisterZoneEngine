/**
 * A player-supply token (bridge, castle, abbey, tunnel, ...). All concrete
 * tokens are defined inside their capability.
 */
export interface Token {
  name(): string;
}
