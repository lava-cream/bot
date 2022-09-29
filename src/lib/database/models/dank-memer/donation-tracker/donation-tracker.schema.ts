import { Schema, CastDocument, CastJSON, prop, CreateResolvableSchemaType } from '#lib/database/structures/schema.js';
import { DonationTrackerAutoroleManagerSchema } from './donation-tracker.autorole.schema.js';
import { DonationTrackerCategoryManagerSchema } from './donation-tracker.category.schema.js';

export class DonationTrackerSchema extends Schema {
  @prop({ type: () => DonationTrackerAutoroleManagerSchema, immutable: true, default: new DonationTrackerAutoroleManagerSchema() })
  public readonly autoroles!: DonationTrackerAutoroleManagerSchema;

  @prop({ type: () => DonationTrackerCategoryManagerSchema, immutable: true, default: new DonationTrackerCategoryManagerSchema() })
  public readonly categories!: DonationTrackerCategoryManagerSchema;
}

export declare namespace DonationTrackerSchema {
  type Document = CastDocument<DonationTrackerSchema>;
  type JSON = CastJSON<DonationTrackerSchema>;
  type Resolvable = CreateResolvableSchemaType<DonationTrackerSchema>;
}
