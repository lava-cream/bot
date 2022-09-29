import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { PlayerDefaults, PlayerLimits, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { prop } from '#lib/database/structures/schema.js';

export class PlayerBetSchema {
  @prop({ type: Number, default: PlayerDefaults.Bet })
  public value!: number;

  public update(options: Partial<OmitFunctions<PlayerBetSchema>>): this {
    return Object.assign(this, options);
  }

  public isMaximumValue(mastery: number) {
    return this.value >= Math.round(PlayerLimits.Multiplier + PlayerMasteryAddedLimits.Multiplier * mastery);
  }
}
