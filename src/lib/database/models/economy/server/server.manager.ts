import type DatabaseClient from '#lib/database/client/client.js';
import { Manager } from '#lib/database/structures/manager.js';
import { ServerSchema } from './server.schema.js';

export class ShopManager extends Manager<ServerSchema> {
  public constructor(client: DatabaseClient) {
    super({ client, name: 'economy.server', holds: ServerSchema });
  }
}
