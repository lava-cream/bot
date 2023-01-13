import { PlayerBank, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { prop, CreateNumberValueSchema } from '#lib/database/structures/schema.js';
import { roundZero } from '#lib/utilities';

/**
 * Represents the player's bank space.
 * @since 6.0.0
 */
export class PlayerBankSpaceSchema extends CreateNumberValueSchema(PlayerBank.Default) {
  /**
   * The bank space's value-adding convertion rate.
   */
  @prop({ type: Number })
  public rate!: number;

  /**
   * The bank space's constructor.
   */
  public constructor() {
    super();
    this.rate = PlayerBank.DefaultSpaceMultiplier;
  }

  /**
   * Checks if the bank space is already limited.
   * @param mastery The mastery level.
   * @returns This schema.
   */
  public isMaxValue(mastery: number) {
    return this.value >= Math.round(PlayerBank.MaxLimit + PlayerMasteryAddedLimits.Bank * mastery);
  }

  /**
   * Checks if the bank space multiplier is already maxed.
   * @returns A boolean.
   */
  public isMaxRate() {
    return this.rate >= PlayerBank.MaxSpaceMultiplier;
  }

  /**
   * Increments the bank space's value with the product of the specified value and the bank space's rate.
   * @param value The value to add.
   * @returns This schema.
   */
  public override addValue(value: number): this {
    return super.addValue(roundZero(value * (this.rate / 100)));
  }

  public setRate(rate: number): this {
    this.rate = rate;
    return this;
  }
}

/**
 * Represents the player's bank.
 * @since 6.0.0
 */
export class PlayerBankSchema extends CreateNumberValueSchema(PlayerBank.Default) {
  /**
   * The player's bank space.
   */
  @prop({ type: () => PlayerBankSpaceSchema, immutable: true })
  public readonly space!: PlayerBankSpaceSchema;

  /**
   * The bank's constructor.
   */
  public constructor() {
    super();
    this.space = new PlayerBankSpaceSchema();
  }

  /**
   * The difference between the bank space and the bank's value.
   */
  public get difference() {
    return this.space.value - this.value;
  }

  /**
   * Checks if the bank is full.
   * @returns A boolean.
   */
  public isMaxValue() {
    return this.value >= this.space.value;
  }
}
