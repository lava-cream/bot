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

export class PartyRequestManagerSchema extends CreateSubSchemaManager(PartyRequestSchema) {
  /**
   * Retreives party requests, particularly, expired ones.
   * @param flush If the expired requests should be removed from this manager or not.
   * @returns An array of expired party requests.
   */
  public getExpired(flush = false) {
    const expired = this.entries.filter(entry => Date.now() > entry.expire);
    if (flush) for (const expire of expired) this.delete(expire.id);
    return expired;
  }
}