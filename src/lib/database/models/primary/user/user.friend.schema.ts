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
  Pending = 1,
  Friend = 2,
  Blocked = 3
}

export class UserFriendManagerSchema extends CreateSubSchemaManager(UserFriendSchema) {}