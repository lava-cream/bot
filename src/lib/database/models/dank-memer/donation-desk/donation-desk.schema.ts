import { Schema, CastDocument, CastJSON, prop, CreateResolvableSchemaType } from '#lib/database/structures/schema.js';
import { DonationDeskChannelsSchema } from './donation-desk.channels.schema.js';
import { DonationDeskEntryManagerSchema } from './donation-desk.entry.schema.js';

export class DonationDeskSchema extends Schema {
  @prop({ type: () => DonationDeskChannelsSchema, immutable: true, default: new DonationDeskChannelsSchema({ access: null }) })
  public readonly channels!: DonationDeskChannelsSchema;

  @prop({ type: () => DonationDeskEntryManagerSchema, immutable: true, default: new DonationDeskEntryManagerSchema() })
  public readonly entries!: DonationDeskEntryManagerSchema;
}

export declare namespace DonationDeskSchema {
  type Document = CastDocument<DonationDeskSchema>;
  type JSON = CastJSON<DonationDeskSchema>;
  type Resolvable = CreateResolvableSchemaType<DonationDeskSchema>;
}
