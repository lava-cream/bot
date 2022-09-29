import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { PlayerDefaults, PlayerLimits, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { prop } from '#lib/database/structures/schema.js';

export class PlayerWalletSchema {
  @prop({ type: Number, default: PlayerDefaults.Wallet })
  public value!: number;

  public update(options: Partial<OmitFunctions<PlayerWalletSchema>>): this {
    return Object.assign(this, options);
  }

  public isMaximumValue(mastery: number) {
    return this.value >= this.getMaximumValue(mastery);
  }

  public getMaximumValue(mastery: number) {
    return Math.round(PlayerLimits.Wallet + PlayerMasteryAddedLimits.Wallet * mastery);
  }
}
