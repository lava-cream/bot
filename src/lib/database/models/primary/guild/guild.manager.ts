import type DatabaseClient from '#lib/database/client/client.js';
import { Manager } from '#lib/database/structures/manager.js';
import { GuildSchema } from './guild.schema.js';

export class GuildManager extends Manager<GuildSchema> {
  public constructor(client: DatabaseClient) {
    super({ client, name: 'primary.guild', holds: GuildSchema });
  }
}
