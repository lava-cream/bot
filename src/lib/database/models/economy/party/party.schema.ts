import { Schema, CastDocument, CastJSON, prop, CreateResolvableSchemaType } from '#lib/database/structures/schema.js';
import { PartyMemberManagerSchema } from './party.member.schema.js';
import { PartyRequestManagerSchema } from './party.request.schema.js';

export class PartySchema extends Schema {
  @prop({ type: () => PartyMemberManagerSchema, immutable: true, default: new PartyMemberManagerSchema() })
  public readonly members!: PartyMemberManagerSchema;

  @prop({ type: () => PartyRequestManagerSchema, immutable: true, default: new PartyRequestManagerSchema() })
  public readonly requests!: PartyRequestManagerSchema;
}

export declare namespace PartySchema {
  type Document = CastDocument<PartySchema>;
  type JSON = CastJSON<PartySchema>;
  type Resolvable = CreateResolvableSchemaType<PartySchema>;
}
