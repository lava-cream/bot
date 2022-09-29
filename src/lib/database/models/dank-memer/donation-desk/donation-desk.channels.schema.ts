import type { OmitFunctions } from '#lib/utilities/common/common.types';
import { prop, SchemaTypes } from '#lib/database/structures/schema.js';

export class DonationDeskChannelsSchema {
  @prop({ type: () => DonationDeskChannelsDeskSchema, immutable: true })
  public readonly desk!: DonationDeskChannelsDeskSchema;

  @prop({ type: SchemaTypes.Mixed })
  public access!: string | null;

  public constructor(options: OmitFunctions<Omit<DonationDeskChannelsSchema, 'desk'>>) {
    this.desk = new DonationDeskChannelsDeskSchema({ id: null, message: null });
    this.access = options.access;
  }

  public setAccess(access: string | null): this {
    this.access = access;
    return this;
  }
}

export class DonationDeskChannelsDeskSchema {
  @prop({ type: SchemaTypes.Mixed })
  public id!: string | null;

  @prop({ type: SchemaTypes.Mixed })
  public message!: string | null;

  public constructor(options: OmitFunctions<DonationDeskChannelsDeskSchema>) {
    this.id = options.id;
    this.message = options.message;
  }

  public setId(id: string | null): this {
    this.id = id;
    return this;
  }

  public setMessage(message: string | null): this {
    this.message = message;
    return this;
  }
}
