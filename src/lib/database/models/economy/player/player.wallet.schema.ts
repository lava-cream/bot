import { PlayerDefaults, PlayerLimits, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { CreateNumberValueSchema } from '#lib/database/structures/schema.js';

export class PlayerWalletSchema extends CreateNumberValueSchema(PlayerDefaults.Wallet) {
  public isMaxValue(mastery: number) {
    return this.value >= this.getMaxValue(mastery);
  }

  public getMaxValue(mastery: number) {
    return Math.round(PlayerLimits.Wallet + PlayerMasteryAddedLimits.Wallet * mastery);
  }
}
