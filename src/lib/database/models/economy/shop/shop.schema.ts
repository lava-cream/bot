import { Schema, CastDocument, CastJSON, prop, CreateResolvableSchemaType } from '#lib/database/structures/schema.js';
import { ShopItemManagerSchema } from './shop.item.schema.js';

export class ShopSchema extends Schema {
  @prop({ type: () => ShopItemManagerSchema, immutable: true, default: new ShopItemManagerSchema() })
  public readonly items!: ShopItemManagerSchema;
}

export declare namespace ShopSchema {
  type Document = CastDocument<ShopSchema>;
  type JSON = CastJSON<ShopSchema>;
  type Resolvable = CreateResolvableSchemaType<ShopSchema>;
}
