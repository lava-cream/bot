import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { PlayerDefaults, PlayerLimits, PlayerEnergy } from '#lib/utilities/constants/index.js';
import { CreateValueSchema, prop } from '#lib/database/structures/schema.js';

export class PlayerEnergySchema extends CreateValueSchema<number>(PlayerDefaults.Energy) {
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

  public setStars(stars: number) {
    this.stars = stars;
    return this;
  }

  public setExpire(expire: Date | number) {
    this.expire = expire instanceof Date ? expire.getTime() : expire;
    return this;
  }
}
