import { type SapphireClient, Events, Listener } from '@sapphire/framework';
import { Stopwatch } from '@sapphire/stopwatch';

export class ClientReadyListener extends Listener<typeof Events.ClientReady> {
  public constructor(context: Listener.Context) {
    super(context, { event: Events.ClientReady, once: true });
  }

  public async run(client: SapphireClient<true>) {
    const loggers = this.container.stores.get('loggers');

    for (const guild of client.guilds.cache.values()) {
      for (const logger of loggers.values()) {
        try {
          const watch = new Stopwatch();
          await logger.syncLogChannel(guild);

          client.logger.info('[LOGGER]', `Successfully linked the "${logger.name}" logs for "${guild.name}" (took ${watch.stop().duration}ms)`);
        } catch {
          client.logger.info('[LOGGER]', `Unable to sync logs for "${guild.name}"`);
        }
      }
    }
  }
}
