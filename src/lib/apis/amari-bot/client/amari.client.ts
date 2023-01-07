import { LeaderboardManager } from '../managers/leaderboard.manager.js';
import { MemberManager } from '../managers/member.manager.js';
import { RewardsManager } from '../managers/rewards.manager.js';
import { container } from '@sapphire/framework';

import type { AmariClientOptions } from './options.client.js';
import { BaseClient } from './base.client.js';

export default class AmariClient extends BaseClient {
  public readonly leaderboards = new LeaderboardManager(this);
  public readonly members = new MemberManager(this);
  public readonly rewards = new RewardsManager(this);

  public constructor(options: AmariClientOptions) {
    super(options);
    container.amari = this;
  }
}

declare module '@sapphire/pieces' {
  interface Container {
    amari: AmariClient;
  }
}
