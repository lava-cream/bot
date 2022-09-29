import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { prop, CreateSubSchemaManager, SubSchema } from '#lib/database/structures/schema.js';

export class PartyMemberSchema extends SubSchema {
  @prop({ type: Number })
  public coins!: number;

  @prop({ type: Number })
  public multiplier!: number;

  public constructor(options: OmitFunctions<PartyMemberSchema>) {
    super(options.id);
    this.coins = options.coins;
    this.multiplier = options.multiplier;
  }

  public setCoins(coins: number): this {
    this.coins = coins;
    return this;
  }

  public setMultiplier(multiplier: number): this {
    this.multiplier = multiplier;
    return this;
  }
}

export class PartyMemberManagerSchema extends CreateSubSchemaManager(PartyMemberSchema) {
  public get coins() {
    return this.entries.reduce((n, c) => n + c.coins, 0);
  }

  public get multiplier() {
    return this.entries.reduce((n, c) => n + c.multiplier, 0);
  }
}

