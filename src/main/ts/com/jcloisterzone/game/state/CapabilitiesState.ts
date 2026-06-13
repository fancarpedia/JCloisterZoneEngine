import { HashMap, type Map as VMap } from "../../../../io/vavr/Map.js";
import { Seq } from "../../../../io/vavr/Seq.js";
import type { ClassToken } from "../../../../lang/Class.js";
import type { Capability } from "../Capability.js";

type CapClass = ClassToken<Capability<unknown>>;

/** Immutable state of the active capabilities and their models. */
export class CapabilitiesState {
  private readonly capabilities: VMap<CapClass, Capability<unknown>>;
  private readonly models: VMap<CapClass, unknown>;

  constructor(capabilities: VMap<CapClass, Capability<unknown>>, models: VMap<CapClass, unknown>) {
    this.capabilities = capabilities;
    this.models = models;
  }

  static createInitial(capabilities: Seq<Capability<unknown>>): CapabilitiesState {
    let caps: VMap<CapClass, Capability<unknown>> = HashMap.empty<CapClass, Capability<unknown>>();
    for (const cap of capabilities) {
      caps = caps.put((cap as object).constructor as CapClass, cap);
    }
    return new CapabilitiesState(caps, HashMap.empty<CapClass, unknown>());
  }

  setCapabilities(capabilities: VMap<CapClass, Capability<unknown>>): CapabilitiesState {
    if (capabilities === this.capabilities) return this;
    return new CapabilitiesState(capabilities, this.models);
  }

  setModels(models: VMap<CapClass, unknown>): CapabilitiesState {
    if (models === this.models) return this;
    return new CapabilitiesState(this.capabilities, models);
  }

  updateModel<M>(cls: ClassToken<Capability<M>>, fn: (model: M) => M): CapabilitiesState {
    const model = this.getModel<M>(cls);
    const newModel = fn(model);
    if (model === newModel) return this;
    return this.setModels(this.models.put(cls as CapClass, newModel));
  }

  setModel<M>(cls: ClassToken<Capability<M>>, model: M): CapabilitiesState {
    const oldModel = this.getModel<M>(cls);
    if (oldModel === model) return this;
    return this.setModels(this.models.put(cls as CapClass, model));
  }

  getCapabilities(): VMap<CapClass, Capability<unknown>> {
    return this.capabilities;
  }

  get<C extends Capability<unknown>>(cls: ClassToken<C>): C | null {
    return (this.capabilities.get(cls as CapClass).getOrNull() as C | null) ?? null;
  }

  contains(cls: CapClass): boolean {
    return this.capabilities.containsKey(cls);
  }

  getModels(): VMap<CapClass, unknown> {
    return this.models;
  }

  getModel<M>(cls: ClassToken<Capability<M>>): M {
    return this.models.get(cls as CapClass).getOrNull() as M;
  }

  toSeq(): Seq<Capability<unknown>> {
    return this.capabilities.values();
  }

  toString(): string {
    return this.toSeq()
      .map((cap) => String(cap))
      .toArray()
      .join(", ");
  }
}
