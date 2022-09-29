import { prop, CreateSubSchemaManager, SubSchema } from '#lib/database/structures/schema.js';
import type { OmitFunctions } from '#lib/utilities/common/index.js';

export class PartyRequestSchema extends SubSchema {
  @prop({ type: String, immutable: true })
  public readonly inviter!: string;

  @prop({ type: Number })
  public expire!: number;

  public constructor(options: OmitFunctions<PartyRequestSchema>) {
    super(options.id);
    this.inviter = options.inviter;
    this.expire = options.expire;
  }

  public setExpire(expire: number): this {
    this.expire = expire;
    return this;
  }
}

export class PartyRequestManagerSchema extends CreateSubSchemaManager(SubSchema) { }