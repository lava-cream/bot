import { PlayerDefaults, PlayerLimits, PlayerTierAddedLimits } from '#lib/utilities/constants/index.js';
import { CreateNumberValueSchema } from '#lib/database/structures/schema.js';

export class PlayerBetSchema extends CreateNumberValueSchema(PlayerDefaults.Bet) {
  public isMaxValue(mastery: number) {
    return this.value >= Math.round(PlayerLimits.Multiplier + PlayerTierAddedLimits.Multiplier * mastery);
  }
}
