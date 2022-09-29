import type { AmariClient } from '../client/amari.client.js';
import { Routes } from '../client/routes.api.js';
import { Rewards } from '../structures/rewards.structure.js';
import type { APIRewards } from '../types/rewards.js';
import { BaseFetchOptions, Manager } from './manager.js';

export class RewardsManager extends Manager<Rewards, Rewards | string> {
  public constructor(client: AmariClient) {
    super(client, Rewards);
  }

  public fetch(guildId: string, options: BaseFetchOptions & { force: true }): Promise<Rewards>;
  public async fetch(guildId: string, options: BaseFetchOptions): Promise<Rewards | null> {
    if (!options.force) return super.resolve(guildId);

    const response = await this.client.requestHandler.request<APIRewards>(Routes.guildRewards(guildId));
    const instance = new Rewards(response);

    if (options.cache) super.add(guildId, instance);
    return instance;
  }
}
