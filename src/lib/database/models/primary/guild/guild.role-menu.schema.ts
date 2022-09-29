import { prop, CreateSubSchemaManager, SubSchema } from '#lib/database/structures/schema.js';
import type { OmitFunctions } from '#lib/utilities/common/index.js';

export class GuildMenuSchema extends SubSchema {
  // The id of this guild menu is the id of the message it's linked to.
  public declare readonly id: string;

  @prop({ type: () => GuildMenuEntryManagerSchema, immutable: true })
  public readonly entries!: GuildMenuEntryManagerSchema;

  @prop({ type: String })
  public name!: string;

  @prop({ type: Number })
  public limit!: number;

  @prop({ type: Number })
  public type!: GuildMenuSchemaTypes;

  public constructor(options: OmitFunctions<Omit<GuildMenuSchema, 'entries'>>) {
    super(options.id);
    this.entries = new GuildMenuEntryManagerSchema();
    this.name = options.name;
    this.limit = options.limit;
    this.type = options.type;
  }
}

export const enum GuildMenuSchemaTypes {
  Single = 1,
  Limited = 2,
  Multiple = 3,
}

export class GuildMenuManagerSchema extends CreateSubSchemaManager(GuildMenuSchema) {}

export class GuildMenuEntrySchema extends SubSchema {
  // The id of this entry is the id of the message component.
  public declare readonly id: string;

  @prop({ type: String, immutable: true })
  public role!: string;

  @prop({ type: String, immutable: true })
  public emoji!: string;

  public constructor(options: OmitFunctions<GuildMenuEntrySchema>) {
    super();
    this.role = options.role;
    this.emoji = options.emoji;
  }
}

export class GuildMenuEntryManagerSchema extends CreateSubSchemaManager(GuildMenuSchema) {}