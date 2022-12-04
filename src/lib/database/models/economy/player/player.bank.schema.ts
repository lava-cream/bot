import { PlayerDefaults, PlayerLimits, PlayerMasteryAddedLimits } from '#lib/utilities/constants/index.js';
import { prop, CreateNumberValueSchema } from '#lib/database/structures/schema.js';

export class PlayerBankSpaceSchema extends CreateNumberValueSchema(0) {
  public isMaxValue(mastery: number) {
    return this.value >= Math.round(PlayerLimits.Bank + PlayerMasteryAddedLimits.Bank * mastery);
  }
}

export class PlayerBankSchema extends CreateNumberValueSchema(PlayerDefaults.Bank) {
  @prop({ type: Number, immutable: true })
  public readonly space!: PlayerBankSpaceSchema;

  public constructor() {
    super();
    this.space = new PlayerBankSpaceSchema();
  }

  public isMaxValue() {
    return this.value >= this.space.value;
  }
}