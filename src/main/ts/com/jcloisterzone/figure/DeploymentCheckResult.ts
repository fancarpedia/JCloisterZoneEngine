/** Result of checking whether a meeple may be deployed on a feature. */
export class DeploymentCheckResult {
  readonly result: boolean;
  readonly error: string | null;

  constructor(error?: string) {
    if (error === undefined) {
      this.result = true;
      this.error = null;
    } else {
      this.result = false;
      this.error = error;
    }
  }

  static readonly OK = new DeploymentCheckResult();
}
