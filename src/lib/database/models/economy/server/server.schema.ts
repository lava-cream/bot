import { Schema, CastDocument, CastJSON, prop, CreateResolvableSchemaType } from '#lib/database/structures/schema.js';
import { ShopItemManagerSchema } from './server.shop.schema.js';

export class ServerSchema extends Schema {
  @prop({ type: () => ShopItemManagerSchema, immutable: true, default: new ShopItemManagerSchema() })
  public readonly shop!: ShopItemManagerSchema;

  public readonly bank!: unknown;
}

export declare namespace ShopSchema {
  type Document = CastDocument<ServerSchema>;
  type JSON = CastJSON<ServerSchema>;
  type Resolvable = CreateResolvableSchemaType<ServerSchema>;
}
