import { type ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { Constants } from 'discord.js';
import { ApplyOptions } from '@sapphire/decorators';

import { getUserAvatarURL, send } from '#lib/utilities/discord/index.js';
import { toTitleCase } from '@sapphire/utilities';
import { inlineCode } from '@discordjs/builders';

@ApplyOptions<Command.Options>({
  name: 'about',
  description: 'Shows some information regarding this current running instance of the bot.'
})
export default class AboutCommand extends Command {
  public override chatInputRun(command: Command.ChatInputInteraction) {
    return void send(command, (builder) =>
      builder.setEphemeral(true).addEmbed((embed) =>
        embed
          .setTitle(toTitleCase(this.container.package.name))
          .setColor(Constants.Colors.DARK_BUT_NOT_BLACK)
          .setDescription(this.container.package.description)
          .setThumbnail(getUserAvatarURL(command.client.user!))
          .setFields(
            {
              name: 'Build Version',
              inline: true,
              value: inlineCode(`v${this.container.package.version}`)
            },
            {
              name: 'Runtime Version',
              inline: true,
              value: inlineCode(process.version)
            },
            {
              name: Constants.Package.name,
              inline: true,
              value: inlineCode(`v${Constants.Package.version}`)
            }
          )
      )
    );
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description));
  }
}
