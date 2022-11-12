import { PlayerDefaults, PlayerLimits, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { CreateValueSchema } from '#lib/database/structures/schema.js';

export class PlayerBetSchema extends CreateValueSchema<number>(PlayerDefaults.Bet) {
  public isMaximumValue(mastery: number) {
    return this.value >= Math.round(PlayerLimits.Multiplier + PlayerMasteryAddedLimits.Multiplier * mastery);
  }
}
