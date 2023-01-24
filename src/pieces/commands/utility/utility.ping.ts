import { type ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { Stopwatch } from '@sapphire/stopwatch';
import { join, edit, send, EmbedTemplates } from '#lib/utilities';
import { inlineCode } from '@discordjs/builders';

@ApplyOptions<Command.Options>({
	name: 'ping',
	description: 'View the websocket and message latency.'
})
export default class PingCommand extends Command {
	public override async chatInputRun(command: Command.ChatInputCommandInteraction) {
		const watch = new Stopwatch().start();

		await send(command, (builder) => builder.addEmbed(() => EmbedTemplates.createSimple('Pinging...')));
		await edit(command, (builder) =>
			builder.addEmbed(() =>
				EmbedTemplates.createSimple(
					join(
						`I have a ${inlineCode(
							`${command.inCachedGuild() ? command.guild.shard.ping : command.client.ws.ping}ms`
						)} internal delay from Discord.`,
						`While it took me ${inlineCode(watch.stop().toString())} to edit this message.`
					)
				)
			)
		);
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand((builder) => builder.setName(this.name).setDescription(this.description), {
			idHints: ['1050342143488704584']
		});
	}
}
