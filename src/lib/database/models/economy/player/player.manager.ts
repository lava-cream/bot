import type { Client } from '#lib/database/client/client.js';
import { Manager } from '#lib/database/structures/manager.js';
import { PlayerSchema } from './player.schema.js';

export class PlayerManager extends Manager<PlayerSchema> {
  public constructor(client: Client) {
    super({ client, name: 'economy.player', holds: PlayerSchema });
  }
}
