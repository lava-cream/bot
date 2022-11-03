import { Schema, CastDocument, CastJSON, prop, CreateResolvableSchemaType } from '#lib/database/structures/schema.js';
import { GuildMenuManagerSchema } from './guild.role-menu.schema.js';

export const enum GuildSchemaStatus {
  // Unverified guilds have limits.
  Unverified = 0,
  // Verified guilds have expanded limits.
  Verified = 1,
  // Suspended guilds cannot use any of the bot's features.
  Suspended = 2,
  // Terminated guilds are suspensions which are unrevokeable. On top of this, any data related to this guild shall also be wiped.
  Terminated = 3
}

export class GuildSchema extends Schema {
  @prop({ type: () => GuildMenuManagerSchema, immutable: true, default: new GuildMenuManagerSchema() })
  public readonly menus!: GuildMenuManagerSchema;

  @prop({ type: Number, default: GuildSchemaStatus.Verified })
  public status!: GuildSchemaStatus;

  public setStatus(status: GuildSchemaStatus) {
    this.status = status;
    return this;
  }
}

export declare namespace GuildSchema {
  type Document = CastDocument<GuildSchema>;
  type JSON = CastJSON<GuildSchema>;
  type Resolvable = CreateResolvableSchemaType<GuildSchema>;
}
