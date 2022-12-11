import { type OmitFunctions, pushElement, resolveElement, removeElement } from '#lib/utilities/common/index.js';
import { prop, SchemaTypes, CreateSubSchemaManager, SubSchema } from '#lib/database/structures/schema.js';

export class ShopItemSchema extends SubSchema {
  @prop({ type: Number })
  public price!: number;

  @prop({ type: Number })
  public type!: ShopItemType;

  @prop({ type: Number })
  public status!: ShopItemStatus;

  @prop({ type: SchemaTypes.Mixed })
  public expire!: number | null;

  @prop({ type: SchemaTypes.Mixed })
  public owner!: string | null;

  @prop({ type: () => [String], immutable: true })
  public readonly sharers!: string[];

  public constructor(options: OmitFunctions<ShopItemSchema>) {
    super(options.id);
    this.price = options.price;
    this.type = options.type;
    this.status = options.status;
    this.expire = options.expire;
    this.owner = options.owner;
    this.sharers = [];
  }

  public get expired() {
    return Date.now() > (this.expire ?? 0);
  }

  public get shareable() {
    return this.status === ShopItemStatus.OwnedPermanent;
  }

  public get shared() {
    return this.sharers.length >= 1;
  }

  public isSharedWith(userId: string) {
    return Boolean(resolveElement(this.sharers, (sharer) => sharer === userId));
  }

  public setPrice(price: number): this {
    this.price = price;
    return this;
  }

  public setType(type: ShopItemType): this {
    this.type = type;
    return this;
  }

  public setExpire(expire: number | null): this {
    this.expire = expire;
    return this;
  }

  public setOwner(owner: string | null): this {
    this.owner = owner;
    return this;
  }

  public addSharer(userId: string): this {
    pushElement(this.sharers, userId);
    return this;
  }

  public removeSharer(userId: string): this {
    removeElement(this.sharers, (sharer) => sharer === userId);
    return this;
  }
}

export const enum ShopItemType {
  Role = 1,
  ChannelText = 2,
  ChannelVoice = 3
}

export const enum ShopItemStatus {
  SaleInitial = 1,
  SaleResell = 2,
  OwnedRent = 3,
  OwnedPermanent = 4
}

export class ShopItemManagerSchema extends CreateSubSchemaManager(ShopItemSchema) {}
