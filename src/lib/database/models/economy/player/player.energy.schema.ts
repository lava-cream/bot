import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { PlayerDefaults, PlayerLimits, PlayerEnergy } from '#lib/utilities/constants/index.js';
import { prop } from '#lib/database/structures/schema.js';

export class PlayerEnergySchema {
  @prop({ type: Number, default: PlayerDefaults.Energy })
  public value!: number;

  @prop({ type: Number, default: PlayerDefaults.Star })
  public stars!: number;

  @prop({ type: Number, default: 0 })
  public expire!: number;

  public update(options: Partial<OmitFunctions<PlayerEnergySchema>>): this {
    return Object.assign(this, options);
  }

  public isMaximumValue() {
    return this.stars >= PlayerLimits.Energy;
  }

  public isMaximumStars() {
    return this.stars >= PlayerLimits.Star;
  }

  public isExpired() {
    return Date.now() > this.expire;
  }

  public getDefaultDuration(tier: number) {
    return Math.round(PlayerEnergy.DefaultDuration + PlayerEnergy.TierAddedDefaultDuration * tier);
  }
}
