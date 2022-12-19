import { PlayerDefaults, PlayerLimits, PlayerEnergy, PlayerTierAddedLimits } from '#lib/utilities/constants/index.js';
import { CreateNumberValueSchema, prop } from '#lib/database/structures/schema.js';

export class PlayerEnergySchema extends CreateNumberValueSchema(PlayerDefaults.Star) {
  @prop({ type: Number, default: 0 })
  public expire!: number;

  public get energy() {
    return Math.floor(this.value / PlayerEnergy.StarRatio);
  }

  public isMaxStars() {
    return this.value >= PlayerLimits.Star;
  }

  public isMaxEnergy(tier: number) {
    return this.energy >= (PlayerLimits.Star / PlayerEnergy.StarRatio) + PlayerTierAddedLimits.Energy * tier;
  }

  public isExpired() {
    return Date.now() > this.expire;
  }

  public override addValue(): this {
    return super.addValue(PlayerEnergy.StarGain);
  }

  public getDefaultDuration(tier: number) {
    return Math.round(PlayerEnergy.DefaultDuration + PlayerEnergy.TierAddedDefaultDuration * tier);
  }

  public addEnergy(value: number) {
    return super.addValue(value * PlayerEnergy.StarRatio);
  }

  public subEnergy(value: number) {
    return super.subValue(value * PlayerEnergy.StarRatio);
  }

  public setExpire(expire: Date | number) {
    this.expire = expire instanceof Date ? expire.getTime() : expire;
    return this;
  }
}
