import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { prop, SchemaTypes } from '#lib/database/structures/schema.js';

export class ItemGuideChannelsMainSchema {
  @prop({ type: SchemaTypes.Mixed })
  public id!: string | null;

  public constructor(options: OmitFunctions<ItemGuideChannelsMainSchema>) {
    this.id = options.id;
  }

  public setId(id: string | null): this {
    this.id = id;
    return this;
  }
}

export class ItemGuideChannelsManagerSchema {
  @prop({ type: () => ItemGuideChannelsMainSchema, immutable: true })
  public readonly main!: ItemGuideChannelsMainSchema;

  @prop({ type: SchemaTypes.Mixed })
  public updates!: string | null;

  public constructor(options: OmitFunctions<Omit<ItemGuideChannelsManagerSchema, 'main'>>) {
    this.main = new ItemGuideChannelsMainSchema({ id: null });
    this.updates = options.updates;
  }

  public setUpdates(updates: string | null): this {
    this.updates = updates;
    return this;
  }
}