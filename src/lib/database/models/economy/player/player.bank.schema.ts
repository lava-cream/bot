import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { PlayerDefaults, PlayerLimits, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { prop, CreateValueSchema } from '#lib/database/structures/schema.js';

export class PlayerBankSchema extends CreateValueSchema<number>(PlayerDefaults.Bank) {
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

  public addValue(value: number): this {
    return this.setValue(this.value + value);
  }

  public subValue(value: number): this {
    return this.setValue(this.value - value);
  }

  public setSpace(space: number): this {
    this.space = space;
    return this;
  }

  public addSpace(space: number): this {
    return this.setSpace(this.space + space);
  }

  public subSpace(space: number): this {
    return this.setSpace(this.space - space);
  }
}
