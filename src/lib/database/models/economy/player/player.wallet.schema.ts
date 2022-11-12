import { PlayerDefaults, PlayerLimits, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { CreateValueSchema } from '#lib/database/structures/schema.js';

export class PlayerWalletSchema extends CreateValueSchema<number>(PlayerDefaults.Wallet) {
  public isMaximumValue(mastery: number) {
    return this.value >= this.getMaximumValue(mastery);
  }

  public getMaximumValue(mastery: number) {
    return Math.round(PlayerLimits.Wallet + PlayerMasteryAddedLimits.Wallet * mastery);
  }

  public addValue(value: number) {
    this.value += value;
    return this;
  }

  public subValue(value: number) {
    this.value -= value;
    return this;
  }
}
