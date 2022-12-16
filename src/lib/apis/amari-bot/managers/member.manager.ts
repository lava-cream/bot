import type AmariClient from '../client/amari.client.js';
import { Routes } from '../client/routes.api.js';
import { Member } from '../structures/member.structure.js';
import type { APIMember } from '../types/member.js';
import { BaseFetchOptions, Manager } from './manager.js';

export class MemberManager extends Manager<Member, Member | string> {
  public constructor(client: AmariClient) {
    super(client, Member);
  }

  public fetch(guildId: string, memberId: string, options: BaseFetchOptions & { force: true }): Promise<Member>;
  public async fetch(guildId: string, memberId: string, options: BaseFetchOptions): Promise<Member | null> {
    if (!options.force) return super.resolve(memberId);

    const endpoint = Routes.guildMember(guildId, memberId);
    const response = await this.client.requestHandler.request<APIMember>(endpoint);
    const instance = new Member(response);

    if (options.cache) super.add(memberId, instance);
    return instance;
  }
}
