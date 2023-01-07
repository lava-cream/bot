/**
 * Options to calculate game winnings.
 */
export interface GameWinningsOptions {
  /**
   * The base value to slightly increase the winnings.
   * @default 0
   */
  base: number;
  /**
   * The multiplier to apply in order to greatly increase the winnings. 
   * @default 0
   */
  multiplier: number;
  /**
   * A random number that might come from a random number generator.
   * @default 0
   */
  random: number;
}

/**
 * Game utility to calculate winnings.
 * @since 6.0.0
 */
export class GameWinnings implements GameWinningsOptions {
  public base: number;
  public multiplier: number;
  public random: number;

  /**
   * The utility's constructor.
   * @param options Options to create an instance of this utility.
   */
  public constructor(public options?: GameWinningsOptions) {
    this.base = options?.base ?? 0;
    this.multiplier = options?.multiplier ?? 0;
    this.random = options?.random ?? 0;
  }

  /**
   * Sets the new base value.
   * @param base The base value.
   * @returns This instance.
   */
  public setBase(base: number): this {
    this.base = base;
    return this;
  }

  /**
   * Sets the new multiplier value.
   * @param multiplier The multiplier value.
   * @returns This instance.
   */
  public setMultiplier(multiplier: number): this {
    this.multiplier = multiplier;
    return this;
  }

  /**
   * Sets the new randomly-generated value.
   * @param random The random value.
   * @returns Ths instance.
   */
  public setRandom(random: number): this {
    this.random = random;
    return this;
  }
  
  /**
   * Calculates the winnings based from the specified {@link value}.
   * @param value The value to calculate.
   * @returns The calculated value.
   */
  public calculate(value: number): number {
    return value * (this.random + this.base) * (1 + this.multiplier);
  }
}

export declare namespace GameWinnings {
  type Options = GameWinningsOptions;
}