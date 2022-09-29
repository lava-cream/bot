import { type ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { CommandInteraction, Constants } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';

import * as DiscordUtil from '#lib/utilities/discord/index.js';
import { toTitleCase } from '@sapphire/utilities';
import { inlineCode } from '@discordjs/builders';

@ApplyOptions<Command.Options>({
  name: 'about',
  description: 'Shows some information regarding this instance of the bot.'
})
export default class AboutCommand extends Command {
  public override chatInputRun(command: CommandInteraction) {
    return command.reply({
      ephemeral: true,
      embeds: [
        {
          title: toTitleCase(this.container.package.name),
          color: Constants.Colors.NOT_QUITE_BLACK,
          description: this.container.package.description,
          thumbnail: { url: DiscordUtil.getUserAvatarURL(command.client.user!) },
          fields: [
            {
              name: 'Build Version',
              inline: true,
              value: inlineCode(this.container.package.version)
            },
            {
              name: 'Runtime Version',
              inline: true,
              value: process.version
            },
            {
              name: Constants.Package.name,
              inline: true,
              value: `v${inlineCode(Constants.Package.version)}`
            }
          ]
        }
      ]
    });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
  }
}
