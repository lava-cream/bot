import type { Client } from '#lib/database/client/client.js';
import { Manager } from '#lib/database/structures/manager.js';
import { ShopSchema } from './shop.schema.js';

export class ShopManager extends Manager<ShopSchema> {
  public constructor(client: Client) {
    super({ client, name: 'economy.shop', holds: ShopSchema });
  }
}
