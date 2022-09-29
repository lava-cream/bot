import { prop, CreateSubSchemaManager, SubSchema } from '#lib/database/structures/schema.js';
import type { OmitFunctions } from '#lib/utilities';

export class DonationTrackerAutoroleSchema extends SubSchema {
  @prop({ type: () => [String], immutable: true })
  public readonly donations!: string[];

  @prop({ type: Number })
  public amount!: number;

  public constructor(options: OmitFunctions<Omit<DonationTrackerAutoroleSchema, 'donations'>>) {
    super(options.id);
    this.amount = options.amount;
    this.donations = [];
  }

  public setAmount(amount: this['amount']): this {
    this.amount = amount;
    return this;
  }
}


export class DonationTrackerAutoroleManagerSchema extends CreateSubSchemaManager(DonationTrackerAutoroleSchema) {
  public sort(donationId?: string) {
    return this.entries.filter(entry => donationId ? entry.donations.includes(donationId) : true).sort((a, b) => b.amount - a.amount);
  }
}