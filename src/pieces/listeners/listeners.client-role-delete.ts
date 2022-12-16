import { isNullOrUndefined } from '@sapphire/utilities';
import { Listener, Events } from '@sapphire/framework';
import type { Role } from 'discord.js';

export default class ClientGuildRoleDeleteListener extends Listener<typeof Events.GuildRoleDelete> {
  public constructor(context: Listener.Context) {
    super(context, { name: Events.GuildRoleDelete });
  }

  public async run(role: Role) {
    const db = await this.container.db.trackers.fetch(role.guild.id);
    const autorole = db.autoroles.find((ar) => ar.id === role.id);

    if (isNullOrUndefined(autorole)) return;

    await db.run((db) => db.autoroles.delete(autorole.id)).save();
  }
}
