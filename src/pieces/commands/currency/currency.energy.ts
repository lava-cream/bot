import type { CommandInteraction } from 'discord.js';
import { Command, ApplicationCommandRegistry, CommandOptionsRunTypeEnum } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { bold, time, TimestampStyles } from '@discordjs/builders';
import { join, edit } from '#lib/utilities';
import { Constants } from 'discord.js';

@ApplyOptions<Command.Options>({
  name: 'energy',
  description: 'View something about your energy.',
  runIn: [CommandOptionsRunTypeEnum.GuildText]
})
export default class EnergyCommand extends Command {
  public override async chatInputRun(command: CommandInteraction<'cached'>) {
    await command.deferReply();

    const db = await this.container.db.players.fetch(command.user.id);

    await edit(command, (content) =>
      content.addEmbed((embed) =>
        embed
          .setTitle(`${command.user.username}'s energy`)
          .setColor(Constants.Colors.GOLD)
          .setDescription(
            join(
              `${bold(':star: Stars:')} ${db.energy.stars.toLocaleString()}`,
              `${bold(':zap: Energy:')} ${db.energy.value.toLocaleString()}\n`,
              `${bold(`Expires ${time(new Date(db.energy.expire), TimestampStyles.RelativeTime)}`)}`
            )
          )
      )
    );
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
  }
}
