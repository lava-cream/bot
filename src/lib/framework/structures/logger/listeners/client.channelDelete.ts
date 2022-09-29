import type { DMChannel, NonThreadGuildBasedChannel } from 'discord.js';
import { Events, Listener } from '@sapphire/framework';
import { isGuildBasedChannel } from '@sapphire/discord.js-utilities';

export class ClientReadyListener extends Listener<typeof Events.ChannelDelete> {
  public constructor(context: Listener.Context) {
    super(context, { event: Events.ChannelDelete });
  }

  public async run(channel: DMChannel | NonThreadGuildBasedChannel) {
    if (!channel.isText() || !isGuildBasedChannel(channel)) return;

    const tracker = await this.container.db.trackers.fetch(channel.guild.id);

    await tracker
      .run((db) => {
        const sourceCategory = db.categories.categories.find((c) => c.logs.id === channel.id);
        return sourceCategory?.logs.update({ enabled: false, id: null });
      })
      .save();
  }
}
