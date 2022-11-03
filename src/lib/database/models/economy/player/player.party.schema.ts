import type { OmitFunctions } from '#lib/utilities/common/index.js';
import { CreateSubSchemaManager, prop, SubSchema } from '#lib/database/structures/schema.js';

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

export class PlayerPartyManagerSchema extends CreateSubSchemaManager(PlayerPartySchema) {}