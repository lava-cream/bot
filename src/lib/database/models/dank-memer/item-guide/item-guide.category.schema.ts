import { prop, SchemaTypes, CreateSubSchemaManager, SubSchema } from '#lib/database/structures/schema.js';
import type { OmitFunctions } from '#lib/utilities/common/index.js';

export class ItemGuideCategorySchema extends SubSchema {
  @prop({ type: String })
  public name!: string;

  @prop({ type: () => ItemGuideCategoryItemManagerSchema, immutable: true })
  public readonly items!: ItemGuideCategoryItemManagerSchema;

  public constructor(options: OmitFunctions<Omit<ItemGuideCategorySchema, 'items'>>) {
    super(options.id);
    this.name = options.name;
    this.items = new ItemGuideCategoryItemManagerSchema();
  }

  public setName(name: string): this {
    this.name = name;
    return this;
  }
}

export class ItemGuideCategoryManagerSchema extends CreateSubSchemaManager(ItemGuideCategorySchema) {
}

export class ItemGuideCategoryItemSchema extends SubSchema {
  @prop({ type: String })
  public name!: string;

  @prop({ type: Number })
  public price!: number;

  @prop({ type: SchemaTypes.Mixed })
  public emoji!: string | null;

  @prop({ type: Boolean })
  public hidden!: boolean;

  public constructor(options: OmitFunctions<ItemGuideCategoryItemSchema>) {
    super(options.id);
    this.name = options.name;
    this.price = options.price;
    this.emoji = options.emoji;
    this.hidden = options.hidden;
  }

  public isHidden() {
    return this.hidden === true;
  }

  public setName(name: string): this {
    this.name = name;
    return this;
  }

  public setPrice(price: number): this {
    this.price = price;
    return this;
  }

  public setEmoji(emoji: string | null): this {
    this.emoji = emoji;
    return this;
  }

  public hide(): this {
    this.hidden = true;
    return this;
  }

  public unhide(): this {
    this.hidden = false;
    return this;
  }
}

export class ItemGuideCategoryItemManagerSchema extends CreateSubSchemaManager(ItemGuideCategoryItemSchema) {
}