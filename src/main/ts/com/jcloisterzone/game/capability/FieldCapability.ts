import { Capability } from "../Capability.js";

/** Marks fields as requiring this capability to deploy (base farmers rule). */
export class FieldCapability extends Capability<void> {}

Capability.register(FieldCapability);
