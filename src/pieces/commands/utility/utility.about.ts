import { type ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import discordJs from 'discord.js/package.json' assert { type: 'json' };

import { EmbedTemplates, getUserAvatarURL, send } from '#lib/utilities/discord/index.js';
import { toTitleCase } from '@sapphire/utilities';
import { inlineCode } from '@discordjs/builders';

@ApplyOptions<Command.Options>({
	name: 'about',
	description: 'Shows some information regarding this current running instance of the bot.'
})
export default class AboutCommand extends Command {
	public override chatInputRun(command: Command.ChatInputCommandInteraction) {
		return void send(command, (builder) =>
			builder.setEphemeral(true).addEmbed(() =>
				EmbedTemplates.createCamouflaged()
					.setTitle(toTitleCase(this.container.package.name))
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
							name: discordJs.name,
							inline: true,
							value: inlineCode(`v${discordJs.version}`)
						}
					)
			)
		);
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description), {
			idHints: ['1050342065088778291']
		});
	}
}
