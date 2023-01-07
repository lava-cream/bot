import { PlayerDefaults, PlayerLimits, PlayerTierAddedLimits } from '#lib/utilities/constants/index.js';
import { CreateNumberValueSchema, prop } from '#lib/database/structures/schema.js';

export class PlayerMultiplierSchema extends CreateNumberValueSchema(PlayerDefaults.Multiplier) {
  @prop({ type: Number, default: 0 })
  public expire!: number;

  public isExpired() {
    return Date.now() >= this.expire;
  }

  public isMaxValue(mastery: number) {
    return this.value >= Math.round(PlayerLimits.Multiplier + PlayerTierAddedLimits.Multiplier * mastery);
  }

  public setExpire(expire: Date | number) {
    this.expire = expire instanceof Date ? expire.getTime() : expire;
    return this;
  }
}
