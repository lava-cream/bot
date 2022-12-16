import type { SapphireClient } from '@sapphire/framework';
import { Listener, Events } from '@sapphire/framework';
import { Constants, PresenceData } from 'discord.js';
import chalk from 'chalk';

export default class ClientReadyListener extends Listener<typeof Events.ClientReady> {
  public constructor(context: Listener.Context) {
    super(context, { name: Events.ClientReady });
  }

  public async run(client: SapphireClient<true>) {
    const { white, green } = chalk;

    client.user.presence.set(ClientReadyListener.getPresenceData(client));
    client.logger.info(white('[CLIENT]'), green(`Logged in as ${client.user.tag}`));
    client.logger.info(
      white('[CLIENT]'),
      green(`Loaded ${client.stores.reduce((acc, s) => acc + s.size, 0).toLocaleString()} pieces from ${client.stores.size} stores.`)
    );
  }

  private static getPresenceData(client: SapphireClient<true>): PresenceData {
    return {
      status: 'online',
      activities: [
        {
          name: client.support.name,
          type: Constants.ActivityTypes.WATCHING
        }
      ]
    };
  }
}
