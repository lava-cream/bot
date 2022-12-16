import { Events, Listener } from '@sapphire/framework';
import chalk from 'chalk';

import type { Guild } from 'discord.js';

export class ClientReadyListener extends Listener<typeof Events.GuildCreate> {
  public constructor(context: Listener.Context) {
    super(context, { event: Events.GuildCreate });
  }

  public async run(guild: Guild) {
    const loggers = this.container.stores.get('loggers');
    const { whiteBright, greenBright, redBright } = chalk;

    for (const logger of loggers.values()) {
      try {
        await logger.sync(guild);
        this.container.logger.info(whiteBright('[LOGGER]'), greenBright(`Re-synced "${logger.name}" for guild "${guild.name}"`));
      } catch (error) {
        this.container.logger.error(whiteBright('[LOGGER]'), redBright(`Unable to sync logger "${logger.name}" for guild "${guild.name}".`), error);
      }
    }
  }
}
