import { Listener, Events } from '@sapphire/framework';

export default class ClientDebugListener extends Listener<typeof Events.Debug> {
  public constructor(context: Listener.Context) {
    super(context, { name: Events.Debug });
  }

  public run(message: string) {
    return this.container.logger.info(message);
  }
}
