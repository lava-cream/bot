import { isPromiseFulfilled, OmitFunctions } from '#lib/utilities/common/index.js';
import { CreateSubSchemaManager, prop, SubSchema } from '#lib/database/structures/schema.js';
import { container } from '@sapphire/framework';
import { isNullOrUndefined } from '@sapphire/utilities';

export class PlayerPartySchema extends SubSchema {
  @prop({ type: Number })
  public type!: PlayerPartyTypes;

  public constructor(options: OmitFunctions<PlayerPartySchema>) {
    super(options.id);
    this.type = options.type;
  }

  public isOwned() {
    return this.type === PlayerPartyTypes.Owner;
  }

  public isMember() {
    return this.isOwned() || this.type === PlayerPartyTypes.Member;
  }

  public isInvited() {
    return this.type === PlayerPartyTypes.Invited; 
  }
}

export const enum PlayerPartyTypes {
  Owner = 1,
  Member = 2,
  Invited = 3
}

export class PlayerPartyManagerSchema extends CreateSubSchemaManager(PlayerPartySchema) {
  public async fetch() {
    return (
      await Promise.allSettled(
        this.entries.map(entry => container.db.parties.fetch(entry.id))
      )
    )
      .filter(isPromiseFulfilled)
      .map(fulfilled => fulfilled.value)
      .filter(isNullOrUndefined);
  }
}