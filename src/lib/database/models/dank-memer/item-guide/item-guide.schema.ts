import { Schema, CastDocument, CastJSON, prop, CreateResolvableSchemaType } from '#lib/database/structures/schema.js';
import { ItemGuideCategoryManagerSchema } from './item-guide.category.schema.js';
import { ItemGuideChannelsManagerSchema } from './item-guide.channels.schema.js';

export class ItemGuideSchema extends Schema {
  @prop({ type: () => ItemGuideCategoryManagerSchema, immutable: true, default: new ItemGuideCategoryManagerSchema() })
  public readonly categories!: ItemGuideCategoryManagerSchema;

  @prop({ type: () => ItemGuideChannelsManagerSchema, immutable: true, default: new ItemGuideChannelsManagerSchema({ updates: null }) })
  public readonly channels!: ItemGuideChannelsManagerSchema;
}

export declare namespace ItemGuideSchema {
  type Document = CastDocument<ItemGuideSchema>;
  type JSON = CastJSON<ItemGuideSchema>;
  type Resolvable = CreateResolvableSchemaType<ItemGuideSchema>;
}
