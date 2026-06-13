import { Capability } from "../Capability.js";

/**
 * Black Tower variant (affects Tower piece distribution).
 * TODO(port): minimal stub — only the class token is referenced so far
 * (TowerCapability.onStartGame checks hasCapability(BlackTowerCapability)).
 */
export class BlackTowerCapability extends Capability<void> {}

Capability.register(BlackTowerCapability);
