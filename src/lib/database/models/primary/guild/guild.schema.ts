import { Schema, CastDocument, CastJSON, prop, CreateResolvableSchemaType } from '#lib/database/structures/schema.js';
import { GuildMenuManagerSchema } from './guild.role-menu.schema.js';

export const enum GuildSchemaStatus {
  Verified = 1,
  Blocked = 2,
  Banned = 3
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
