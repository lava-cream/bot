import { Schema, CastDocument, CastJSON, prop, CreateResolvableSchemaType } from '#lib/database/structures/schema.js';
import { UserFriendManagerSchema } from './user.friend.schema.js';

export const enum UserSchemaStatus {
  // The user does not have any violation.
  None = 1,
  // Blocked users cannot use the bot's features. This is revokeable.
  Blocked = 2,
  // This is an unrevokeable block. The user's data is also wiped.
  Banned = 3
}

export class UserSchema extends Schema {
  @prop({ type: () => UserFriendManagerSchema, immutable: true, default: new UserFriendManagerSchema() })
  public readonly friends!: UserFriendManagerSchema;

  @prop({ type: Number, default: UserSchemaStatus.None })
  public status!: UserSchemaStatus;

  public setStatus(status: UserSchemaStatus) {
    this.status = status;
    return this;
  }
}

export declare namespace UserSchema {
  type Document = CastDocument<UserSchema>;
  type JSON = CastJSON<UserSchema>;
  type Resolvable = CreateResolvableSchemaType<UserSchema>;
}
