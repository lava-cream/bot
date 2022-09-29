import type { SapphireClient } from '@sapphire/framework';
import { Listener, Events } from '@sapphire/framework';
import { Constants, PresenceData } from 'discord.js';

export default class ClientReadyListener extends Listener<typeof Events.ClientReady> {
  public constructor(context: Listener.Context) {
    super(context, { name: Events.ClientReady });
  }

  public async run(client: SapphireClient<true>) {
    client.user.presence.set(ClientReadyListener.getPresenceData(client));
    client.logger.info('[CLIENT]', `Logged in as ${client.user.tag}`);
    client.logger.info('[CLIENT]', `Loaded ${client.stores.reduce((acc, s) => acc + s.size, 0).toLocaleString()} total pieces.`);
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
