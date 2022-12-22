import { PlayerDefaults, PlayerLimits, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { prop, CreateNumberValueSchema } from '#lib/database/structures/schema.js';

/**
 * Represents the player's bank space.
 * @since 6.0.0
 */
export class PlayerBankSpaceSchema extends CreateNumberValueSchema(0) {
  /**
   * Checks if the bank space is already limited.
   * @param mastery The mastery level.
   * @returns This schema.
   */
  public isMaxValue(mastery: number) {
    return this.value >= Math.round(PlayerLimits.Bank + PlayerMasteryAddedLimits.Bank * mastery);
  }
}

/**
 * Represents the player's bank.
 * @since 6.0.0
 */
export class PlayerBankSchema extends CreateNumberValueSchema(PlayerDefaults.Bank) {
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
   * Checks if the bank is full.
   * @returns A boolean.
   */
  public isMaxValue() {
    return this.value >= this.space.value;
  }
}
