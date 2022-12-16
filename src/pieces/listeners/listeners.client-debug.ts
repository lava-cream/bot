import { Listener, Events } from '@sapphire/framework';
import chalk from 'chalk';

export default class ClientDebugListener extends Listener<typeof Events.Debug> {
  public constructor(context: Listener.Context) {
    super(context, { name: Events.Debug });
  }

  public run(message: string) {
    return this.container.logger.info(chalk.whiteBright(message));
  }
}
