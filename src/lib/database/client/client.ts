import { DonationDeskManager, DonationTrackerManager, ItemGuideManager } from '#lib/database/models/dank-memer/index.js';
import { PartyManager, PlayerManager, ShopManager } from '#lib/database/models/economy/index.js';
import { GuildManager, UserManager } from '#lib/database/models/primary/index.js';
import { container } from '@sapphire/framework';
import { BaseClient } from './client.base.js';
import type { ClientOptions } from './client.options.js';

export class Client extends BaseClient {
  public readonly guides = new ItemGuideManager(this);
  public readonly desks = new DonationDeskManager(this);
  public readonly trackers = new DonationTrackerManager(this);

  public readonly parties = new PartyManager(this);
  public readonly players = new PlayerManager(this);
  public readonly shops = new ShopManager(this);

  public readonly users = new UserManager(this);
  public readonly guilds = new GuildManager(this);

  public constructor(options: ClientOptions) {
    super(options);
    container.db = this;
  }
}

declare module '@sapphire/pieces' {
  interface Container {
    db: Client;
  }
}
