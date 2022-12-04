import { Schema, CastDocument, CastJSON, prop, CreateResolvableSchemaType } from '#lib/database/structures/schema.js';
import { PartyDefaults, PartyLimits, PartyPrestige } from '#lib/utilities';
import { PartyMemberManagerSchema } from './party.member.schema.js';
import { PartyRequestManagerSchema } from './party.request.schema.js';

export class PartySchema extends Schema {
  @prop({ type: () => PartyMemberManagerSchema, immutable: true, default: new PartyMemberManagerSchema() })
  public readonly members!: PartyMemberManagerSchema;

  @prop({ type: () => PartyRequestManagerSchema, immutable: true, default: new PartyRequestManagerSchema() })
  public readonly requests!: PartyRequestManagerSchema;

  @prop({ type: Number, default: PartyDefaults.Prestige })
  public prestige!: number;

  /**
   * The total amount of coins every member of this party has.
   */
  public get coins() {
    return this.members.entries.reduce((n, entry) => n + entry.coins, 0);
  }

  /**
   * The total multiplier every member of this party has.
   */
  public get multiplier() {
    return this.members.entries.reduce((n, entry) => n + entry.multiplier, 0);
  }

  /**
   * The total claimable keys of the whole party from its members.
   */
  public get keys() {
    return this.members.entries.reduce((n, entry) => n + entry.keys, 0);
  }

  public get limits() {
    return {
      coins: Math.round(PartyLimits.Coins + (PartyPrestige.AddedCoinsLimit * this.prestige)),
      multiplier: Math.round(PartyLimits.Multiplier + (PartyPrestige.AddedMultiplierLimit * this.prestige)),
      keys: Math.round(PartyLimits.Keys + (PartyPrestige.AddedKeysLimit * this.prestige)),
    };
  }

  public get prestigeRequirements() {
    return {
      coins: Math.round(PartyPrestige.RequiredCoins * (this.prestige + 1))
    };
  }

  public setPrestige(prestige: number): this {
    this.prestige = prestige;
    return this;
  }
}

export declare namespace PartySchema {
  type Document = CastDocument<PartySchema>;
  type JSON = CastJSON<PartySchema>;
  type Resolvable = CreateResolvableSchemaType<PartySchema>;
}
