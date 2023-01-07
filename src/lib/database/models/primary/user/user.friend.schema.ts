import { prop, CreateSubSchemaManager, SubSchema } from '#lib/database/structures/schema.js';
import type { OmitFunctions } from '#lib/utilities/common/index.js';

export class UserFriendSchema extends SubSchema {
  @prop({ type: Number })
  public since!: number;

  @prop({ type: Number })
  public statuses!: UserFriendStatus;

  public constructor(options: OmitFunctions<UserFriendSchema>) {
    super(options.id);
    this.since = options.since;
    this.statuses = options.statuses;
  }
}

export const enum UserFriendStatus {
  // The recepient is yet to accept the request.
  Pending = 1,
  // Pretty self-explanatory.
  Friend = 2,
  // Pretty self-explanatory.
  Blocked = 3
}

export class UserFriendManagerSchema extends CreateSubSchemaManager(UserFriendSchema) {}
