import { Command, ApplicationCommandRegistry } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

import { percent, send, InteractionMessageContentBuilder, toReadable } from '#lib/utilities';
import type { User } from 'discord.js';
import type { PlayerSchema } from '#lib/database';
import { EmbedTemplates } from '#lib/utilities';

@ApplyOptions<Command.Options>({
	name: 'balance',
	description: "Checks for the balance of yours or someone else's."
})
export default class BalanceCommand extends Command {
	public override async chatInputRun(command: Command.ChatInputCommandInteraction) {
		const user = command.options.getUser('user') ?? command.user;
		const db = await this.container.db.players.fetch(user.id);

		await send(command, BalanceCommand.renderContent(user, db));
		await db.save();
	}

	private static renderContent(user: User, db: PlayerSchema) {
		return new InteractionMessageContentBuilder().addEmbed(() =>
			EmbedTemplates.createCamouflaged()
				.setTitle(`${user.username}'s balance`)
				.addFields(
					{
						name: 'Wallet',
						value: db.wallet.toLocaleString(),
						inline: true
					},
					{
						name: `Bank (${percent(db.bank.value, db.bank.space.value)} Full)`,
						value: `${db.bank.toLocaleString()}/${toReadable(db.bank.space.value, 2)}`,
						inline: true
					},
					{
						name: 'Net Worth',
						value: db.netWorth.toLocaleString()
					}
				)
		);
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder
					.setName(this.name)
					.setDescription(this.description)
					.addUserOption((option) => option.setName('user').setDescription('The user to check for.')),
			{
				idHints: ['1050341967051108403']
			}
		);
	}
}
