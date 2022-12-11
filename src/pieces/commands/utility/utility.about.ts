import { type ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { CommandInteraction, Constants } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';

import * as DiscordUtil from '#lib/utilities/discord/index.js';
import { toTitleCase } from '@sapphire/utilities';
import { inlineCode } from '@discordjs/builders';
import { send } from '#lib/utilities/discord/index.js';

@ApplyOptions<Command.Options>({
  name: 'about',
  description: 'Shows some information regarding this instance of the bot.'
})
export default class AboutCommand extends Command {
  public override async chatInputRun(command: CommandInteraction) {
    return void (await send(command, (builder) =>
      builder.setEphemeral(true).addEmbed((embed) =>
        embed
          .setTitle(toTitleCase(this.container.package.name))
          .setColor(Constants.Colors.NOT_QUITE_BLACK)
          .setDescription(this.container.package.description)
          .setThumbnail(DiscordUtil.getUserAvatarURL(command.client.user!))
          .setFields(
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
          )
      )
    ));
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
  }
}
