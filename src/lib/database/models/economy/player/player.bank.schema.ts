import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { PlayerDefaults, PlayerLimits, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { prop } from '#lib/database/structures/schema.js';

export class PlayerBankSchema {
  @prop({ type: Number, default: PlayerDefaults.Bank })
  public value!: number;

  @prop({ type: Number, default: PlayerDefaults.Bank })
  public space!: number;

  public update(options: Partial<OmitFunctions<PlayerBankSchema>>): this {
    return Object.assign(this, options);
  }

  public isMaximumValue() {
    return this.value >= this.space;
  }

  public isMaximumSpace(mastery: number) {
    return this.value >= Math.round(PlayerLimits.Bank + PlayerMasteryAddedLimits.Bank * mastery);
  }
}
