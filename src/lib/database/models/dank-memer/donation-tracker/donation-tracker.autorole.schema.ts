import { prop, CreateSubSchemaManager, SubSchema } from '#lib/database/structures/schema.js';
import type { OmitFunctions } from '#lib/utilities';

export class DonationTrackerAutoroleSchema extends SubSchema {
  @prop({ type: Number })
  public amount!: number;

  public constructor(options: OmitFunctions<Omit<DonationTrackerAutoroleSchema, 'donations'>>) {
    super(options.id);
    this.amount = options.amount;
  }

  public setAmount(amount: this['amount']): this {
    this.amount = amount;
    return this;
  }
}


export class DonationTrackerAutoroleManagerSchema extends CreateSubSchemaManager(DonationTrackerAutoroleSchema) {
  public sort() {
    return this.entries.sort((a, b) => b.amount - a.amount);
  }
}