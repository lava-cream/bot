import type DatabaseClient from '#lib/database/client/client.js';
import { Manager } from '#lib/database/structures/manager.js';
import { PartySchema } from './party.schema.js';

export class PartyManager extends Manager<PartySchema> {
  public constructor(client: DatabaseClient) {
    super({ client, name: 'economy.party', holds: PartySchema });
  }
}
