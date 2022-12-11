import { type ApplicationCommandRegistry, Command } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';

import { Stopwatch } from '@sapphire/stopwatch';
import { randomColor, join, edit, send } from '#lib/utilities';
import { bold, inlineCode } from '@discordjs/builders';

@ApplyOptions<Command.Options>({
  name: 'ping',
  description: 'View the websocket and message latency.'
})
export default class PingCommand extends Command {
  public override async chatInputRun(command: CommandInteraction) {
    const watch = new Stopwatch().start();

    await send(command, 'Pinging...');
    await edit(command, (builder) =>
      builder
        .setContent(null)
        .addEmbed((embed) =>
          embed
            .setColor(randomColor())
            .setDescription(
              join(
                `${bold('✏ Editing Messages:')} ${inlineCode(watch.stop().toString())}`,
                `${bold('🤖 Websocket Ping:')} ${inlineCode(`${command.inCachedGuild() ? command.guild.shard.ping : command.client.ws.ping}ms`)}`
              )
            )
        )
    );
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
  }
}
