import type { ClassToken } from "../../../lang/Class.js";
import type { Feature } from "../feature/Feature.js";
import { AbstractPlayerAction } from "./AbstractPlayerAction.js";

/** The active player chooses whether everyone deploys or removes a meeple for the
 *  just-placed corn circle (of feature type {@code cornType}). */
export class CornCircleSelectDeployOrRemoveAction extends AbstractPlayerAction<void> {
  static readonly simpleName = "CornCircleSelectDeployOrRemoveAction";

  constructor(private readonly cornType: ClassToken<Feature>) {
    super(null);
  }

  getCornType(): ClassToken<Feature> {
    return this.cornType;
  }
}
