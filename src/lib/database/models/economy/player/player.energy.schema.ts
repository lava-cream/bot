import { PlayerDefaults, PlayerLimits, PlayerEnergy, PlayerTierAddedLimits } from '#lib/utilities/constants/index.js';
import { CreateNumberValueSchema, prop } from '#lib/database/structures/schema.js';

/**
 * Represents the player's energy.
 * @since 6.0.0
 */
export class PlayerEnergySchema extends CreateNumberValueSchema(PlayerDefaults.Star) {
  /**
   * The energy's expiration timestamp.
   */
  @prop({ type: Number, default: 0 })
  public expire!: number;

  /**
   * The player's energy.
   */
  public get energy() {
    return Math.floor(this.value / PlayerEnergy.StarRatio);
  }

  /**
   * Checks if the player's stars is already at its maximum limit.
   * @returns A boolean.
   */
  public isMaxStars() {
    return this.value >= PlayerLimits.Star;
  }

  /**
   * Checks if the player's energy is already at its maximum limit.
   * @param tier The tier level of the player.
   * @returns This schema.
   */
  public isMaxEnergy(tier: number) {
    return this.energy >= (PlayerLimits.Star / PlayerEnergy.StarRatio) + PlayerTierAddedLimits.Energy * tier;
  }

  /**
   * Checks if the player's energy is expired.
   * @returns A boolean.
   */
  public isExpired() {
    return Date.now() > this.expire;
  }

  /**
   * Increments the player's stars.
   * @returns This schema.
   */
  public override addValue(): this {
    return super.addValue(PlayerEnergy.StarsAddedPerWin);
  }

  /**
   * Decrements the player's stars.
   * @returns This schema.
   */
  public override subValue(): this {
    return this.energy > PlayerEnergy.StarsAddedPerWin ? super.subValue(PlayerEnergy.StarsAddedPerWin) : this;
  }

  /**
   * Increments the player's energy.
   * @param value The value to add.
   * @returns This schema.
   */
  public addEnergy(value: number) {
    return super.addValue(value * PlayerEnergy.StarRatio);
  }

  /**
   * Decrements the player's energy.
   * @param value The value to subtract.
   * @returns This schema.
   */
  public subEnergy(value: number) {
    return super.subValue(value * PlayerEnergy.StarRatio);
  }

  /**
   * Gets the default duration for the player's energy expiring date.
   * @param tier The tier level of the player.
   * @returns The default duration the player can add.
   */
  public getDefaultDuration(tier: number) {
    return Math.round(PlayerEnergy.DefaultDuration + PlayerEnergy.TierAddedDefaultDuration * tier);
  }

  /**
   * Sets the expiration date of the energy.
   * @param expire The expiration date of the energy.
   * @returns This schema.
   */
  public setExpire(expire: Date | number) {
    this.expire = expire instanceof Date ? expire.getTime() : expire;
    return this;
  }
}
