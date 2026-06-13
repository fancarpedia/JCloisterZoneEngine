import { Capability } from "../Capability.js";

/** Fishermen (fan variant of the River): an empty MARKER capability, mirroring Java.
 *  Its mere presence switches behaviour elsewhere: rivers become deployable
 *  (AbstractActionPhase), river completion counts for the donkey (DonkeyCapability),
 *  field corn circles / the CoC market quarter work without farmers (CornCircleCapability,
 *  CocFollowerPhase). When the `fishermen` element is present the engine adds this INSTEAD
 *  of RiverCapability (Engine.java if/else), so the river tile groups keep their default
 *  activation and river placement is unrestricted. */
export class FishermenCapability extends Capability<void> {}

Capability.register(FishermenCapability);
