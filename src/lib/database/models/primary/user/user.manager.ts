import type { Client } from '#lib/database/client/client.js';
import { Manager } from '#lib/database/structures/manager.js';
import { UserSchema } from './user.schema.js';

export class UserManager extends Manager<UserSchema> {
  public constructor(client: Client) {
    super({ client, name: 'primary.user', holds: UserSchema });
  }
}
