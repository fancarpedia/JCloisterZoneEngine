import { Capability } from "../Capability.js";

/** Phantom (Count, King &amp; Robber / Phantom mini-expansion) — a second follower
 *  the player may deploy in a dedicated phase after the normal action. The figure
 *  and its phase carry the behaviour; the capability is just a marker. */
export class PhantomCapability extends Capability<void> {}

Capability.register(PhantomCapability);
