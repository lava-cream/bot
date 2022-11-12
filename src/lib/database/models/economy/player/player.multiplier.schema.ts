import { PlayerDefaults, PlayerLimits, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { CreateValueSchema } from '#lib/database/structures/schema.js';

export class PlayerMultiplierSchema extends CreateValueSchema<number>(PlayerDefaults.Multiplier) {
  public isMaximumValue(mastery: number) {
    return this.value >= Math.round(PlayerLimits.Multiplier + PlayerMasteryAddedLimits.Multiplier * mastery);
  }

  public addValue(value: number) {
    return this.setValue(this.value + value);
  }

  public subValue(value: number) {
    return this.setValue(this.value - value);
  }
}
