/**
 * Deterministic PRNG matching the Java engine: derives an int in [0,bound) from
 * a [0,1) seed, then advances the seed with a 48-bit linear congruential
 * generator. BigInt is used for the 48-bit arithmetic to stay exact.
 */
export class RandomGenerator {
  private static readonly m = 281474976710655n; // 2^48 - 1
  private static readonly a = 25214903917n;
  private static readonly c = 11n;

  private random: number;
  private readonly buf = new DataView(new ArrayBuffer(8));

  constructor(random: number) {
    this.random = random;
  }

  setRandom(random: number): void {
    this.random = random;
  }

  getNextInt(bound: number): number {
    const next = Math.trunc(this.random * bound);
    this.buf.setFloat64(0, this.random);
    let x = this.buf.getBigUint64(0) & RandomGenerator.m;
    x = (RandomGenerator.a * x + RandomGenerator.c) & RandomGenerator.m;
    this.random = Number(x) / Number(RandomGenerator.m + 1n);
    return next;
  }
}
