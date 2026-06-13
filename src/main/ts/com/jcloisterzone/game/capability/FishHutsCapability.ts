import { Capability } from "../Capability.js";

/** Fish Huts (fan expansion): empty MARKER capability, mirroring Java. Gates the
 *  deployability of the FishHut feature (its getRequiredCapability). */
export class FishHutsCapability extends Capability<void> {}

Capability.register(FishHutsCapability);
